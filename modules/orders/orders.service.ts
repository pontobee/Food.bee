import { prisma } from "@/lib/prisma";
import { Prisma, FormaPagamento, OrigemPedido, StatusPedido, TipoEntrega } from "@prisma/client";
import { OrderValidationError, OrderNotFoundError } from "@/modules/orders/orders.errors";
import { startOfDayBRT } from "@/lib/timezone";
import type { TenantContext } from "@/modules/shared/tenant.types";

const FORMAS_PAGAMENTO = new Set<string>(Object.values(FormaPagamento));
const ORIGENS_PEDIDO   = new Set<string>(Object.values(OrigemPedido));
const TIPOS_ENTREGA    = new Set<string>(Object.values(TipoEntrega));
const STATUSES_PEDIDO  = new Set<string>(Object.values(StatusPedido));

// ── Tipos de entrada (DTOs vindos da API) ──────────────────────
interface ItemAdicionalInput {
  produto_adicional_id?: string;
}

interface ItemInput {
  produto_id?: string;
  quantidade?: number;
  adicionais?: ItemAdicionalInput[];
}

export interface CriarPedidoInput {
  itens?:            ItemInput[];
  forma_pagamento?:  string;
  origem?:           string;
  cliente_id?:       string | null;
  observacao?:       string | null;
  tipo_entrega?:     string;
  taxa_entrega_id?:  string;
  endereco_entrega?: string | null;
  troco?:            number | null;
}

export interface AtualizarStatusInput {
  status?: string;
  motivo_cancelamento?: string | null;
}


// ── Leitura: pedidos do dia do tenant ──────────────────────────
export function getTodaysOrders(lanchoneteId: string) {
  const inicioDia = startOfDayBRT();

  return prisma.pedido.findMany({
    where: {
      lanchonete_id: lanchoneteId,
      inativo_em:    null,
      criado_em:     { gte: inicioDia },
    },
    include: {
      cliente: { select: { id: true, nome: true, telefone: true } },
      itens: {
        include: {
          adicionais: {
            select: { id: true, nome: true, tipo: true, preco_extra: true },
          },
        },
      },
    },
    orderBy: { numero_pedido: "desc" },
  });
}

// ── Escrita: abre um novo pedido ───────────────────────────────
// Preços NUNCA vêm do cliente: são recalculados a partir dos dados do tenant.
export async function createOrder(input: CriarPedidoInput, ctx: TenantContext) {
  const { lanchoneteId: lid, usuarioId: uid } = ctx;

  // 1. Validação de entrada
  const itensInput = input.itens;
  if (!Array.isArray(itensInput) || itensInput.length === 0) {
    throw new OrderValidationError("Pedido precisa de ao menos um item");
  }
  if (!input.forma_pagamento || !FORMAS_PAGAMENTO.has(input.forma_pagamento)) {
    throw new OrderValidationError("forma_pagamento inválida");
  }
  if (input.origem !== undefined && !ORIGENS_PEDIDO.has(input.origem)) {
    throw new OrderValidationError("origem inválida");
  }
  if (input.tipo_entrega !== undefined && !TIPOS_ENTREGA.has(input.tipo_entrega)) {
    throw new OrderValidationError("tipo_entrega inválido");
  }
  if (input.tipo_entrega === "DELIVERY" && !input.endereco_entrega?.trim()) {
    throw new OrderValidationError("endereço de entrega obrigatório para delivery");
  }
  for (const item of itensInput) {
    if (!item.produto_id || !Number.isInteger(item.quantidade) || (item.quantidade as number) < 1) {
      throw new OrderValidationError("Item de pedido inválido");
    }
  }

  // 2. Busca produtos e adicionais reais do tenant (anti-fraude de preços)
  const produtoIds = [...new Set(itensInput.map((i) => i.produto_id!))];
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, lanchonete_id: lid, inativo_em: null },
  });
  const produtoMap = new Map(produtos.map((p) => [p.id, p]));

  // 2b. Validação de estoque (apenas produtos com controlar_estoque = true)
  for (const item of itensInput) {
    const produto = produtoMap.get(item.produto_id!);
    if (produto?.controlar_estoque && produto.estoque_atual < (item.quantidade ?? 1)) {
      throw new OrderValidationError(
        `"${produto.nome}" sem estoque suficiente (disponível: ${produto.estoque_atual})`
      );
    }
  }

  const adicionalIds = [
    ...new Set(
      itensInput.flatMap((i) =>
        (i.adicionais ?? [])
          .map((a) => a.produto_adicional_id)
          .filter((id): id is string => !!id)
      )
    ),
  ];
  const adicionaisDb = adicionalIds.length
    ? await prisma.produtoAdicional.findMany({
        where: { id: { in: adicionalIds }, lanchonete_id: lid, inativo_em: null },
      })
    : [];
  const adicionalMap = new Map(adicionaisDb.map((a) => [a.id, a]));

  // 3. Recálculo de preços no servidor
  let subtotal = new Prisma.Decimal(0);
  const itensData: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];

  for (const item of itensInput) {
    const produto = produtoMap.get(item.produto_id!);
    if (!produto) {
      throw new OrderValidationError(`Produto ${item.produto_id} não encontrado`);
    }

    let extrasUnitario = new Prisma.Decimal(0);
    const adicionaisData: Prisma.ItemPedidoAdicionalUncheckedCreateWithoutItem_pedidoInput[] = [];
    for (const a of item.adicionais ?? []) {
      const adicional = a.produto_adicional_id ? adicionalMap.get(a.produto_adicional_id) : undefined;
      if (!adicional) {
        throw new OrderValidationError(`Adicional ${a.produto_adicional_id} não encontrado`);
      }
      if (adicional.tipo === "ADICIONAL") extrasUnitario = extrasUnitario.add(adicional.preco_extra);
      adicionaisData.push({
        lanchonete_id:        lid,
        produto_adicional_id: adicional.id,
        nome:                 adicional.nome,
        tipo:                 adicional.tipo,
        preco_extra:          adicional.preco_extra,
      });
    }

    const totalItem = produto.preco_venda.add(extrasUnitario).mul(item.quantidade!);
    subtotal = subtotal.add(totalItem);

    itensData.push({
      lanchonete_id:          lid,
      produto_id:             produto.id,
      produto_nome:           produto.nome,
      produto_preco_unitario: produto.preco_venda,
      quantidade:             item.quantidade!,
      total:                  totalItem,
      adicionais: adicionaisData.length ? { create: adicionaisData } : undefined,
    });
  }

  // 4. Resolve taxa de entrega (server-side — nunca confia no valor do cliente)
  let taxaEntregaValor = new Prisma.Decimal(0);
  let taxaEntregaId: string | undefined;

  if (input.tipo_entrega === "DELIVERY" && input.taxa_entrega_id) {
    const zona = await prisma.taxaEntrega.findFirst({
      where: { id: input.taxa_entrega_id, lanchonete_id: lid, ativa: true },
    });
    if (!zona) throw new OrderValidationError("Zona de entrega não encontrada");
    taxaEntregaValor = zona.taxa;
    taxaEntregaId    = zona.id;
  }

  const total = subtotal.add(taxaEntregaValor);

  // 5. Número sequencial por tenant via função PG
  // UUID inválido causaria erro silencioso no cast ::uuid — validamos antes.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lid)) {
    throw new OrderValidationError("lanchonete_id inválido");
  }
  const seqResult = await prisma.$queryRaw<{ next_numero_pedido: number }[]>`
    SELECT next_numero_pedido(${lid}::uuid) AS next_numero_pedido
  `;
  const numeroPedido = seqResult[0].next_numero_pedido;

  // 6. Persistência
  const pedido = await prisma.pedido.create({
    data: {
      lanchonete_id:   lid,
      usuario_id:      uid,
      cliente_id:      input.cliente_id ?? null,
      numero_pedido:   numeroPedido,
      forma_pagamento: input.forma_pagamento as FormaPagamento,
      origem:          (input.origem as OrigemPedido) ?? "BALCAO",
      observacao:      input.observacao ?? null,
      tipo_entrega:    (input.tipo_entrega as TipoEntrega) ?? "BALCAO",
      taxa_entrega_id: taxaEntregaId ?? null,
      taxa_entrega:    taxaEntregaValor.gt(0) ? taxaEntregaValor : null,
      endereco_entrega: input.endereco_entrega ?? null,
      subtotal,
      desconto:        0,
      total,
      troco:           input.troco ?? null,
      // Pagamentos imediatos (dinheiro/cartão) são marcados como pagos na criação
      pago_em: ["DINHEIRO", "CARTAO_DEBITO", "CARTAO_CREDITO"].includes(input.forma_pagamento ?? "")
        ? new Date()
        : null,
      itens: { create: itensData },
    },
    include: {
      cliente: true,
      itens:   { include: { adicionais: true } },
    },
  });

  const channel = `pedido_status_${lid}`;
  await prisma.$executeRaw`SELECT pg_notify(${channel}, ${pedido.id})`;

  return pedido;
}

// ── Escrita: atualiza status do pedido ─────────────────────────
// Ao entregar, registra a transação de receita (idempotente: só na transição).
export async function updateOrderStatus(
  id: string,
  input: AtualizarStatusInput,
  ctx: TenantContext
) {
  const { lanchoneteId: lid, usuarioId: uid } = ctx;

  if (!input.status || !STATUSES_PEDIDO.has(input.status)) {
    throw new OrderValidationError("status inválido");
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });
  if (!pedido) throw new OrderNotFoundError();

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      status:              input.status as StatusPedido,
      motivo_cancelamento: input.motivo_cancelamento ?? null,
    },
  });

  // Cria transação de receita ao entregar (apenas na transição para ENTREGUE)
  if (input.status === "ENTREGUE" && pedido.status !== "ENTREGUE") {
    const ops: Promise<unknown>[] = [
      prisma.transacao.create({
        data: {
          lanchonete_id: lid,
          pedido_id:     id,
          usuario_id:    uid,
          tipo:          "RECEITA",
          categoria:     "Venda",
          descricao:     `Pedido #${pedido.numero_pedido}`,
          valor:         pedido.total,
        },
      }),
    ];

    if (pedido.cliente_id) {
      ops.push(
        prisma.cliente.update({
          where: { id: pedido.cliente_id },
          data: {
            total_pedidos: { increment: 1 },
            total_gasto:   { increment: pedido.total },
          },
        })
      );
    }

    await Promise.all(ops);
  }

  const channel = `pedido_status_${lid}`;
  await prisma.$executeRaw`SELECT pg_notify(${channel}, ${id})`;

  return atualizado;
}
