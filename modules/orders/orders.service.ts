import { prisma } from "@/lib/prisma";
import { Prisma, FormaPagamento, OrigemPedido, StatusPedido } from "@prisma/client";
import { OrderValidationError, OrderNotFoundError } from "@/modules/orders/orders.errors";

const FORMAS_PAGAMENTO = new Set<string>(Object.values(FormaPagamento));
const ORIGENS_PEDIDO   = new Set<string>(Object.values(OrigemPedido));
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
  itens?: ItemInput[];
  forma_pagamento?: string;
  origem?: string;
  observacao?: string | null;
}

export interface AtualizarStatusInput {
  status?: string;
  motivo_cancelamento?: string | null;
}

/** Contexto do tenant autenticado — toda operação é isolada por lanchonete. */
interface TenantContext {
  lanchoneteId: string;
  usuarioId: string;
}

// ── Leitura: pedidos do dia do tenant ──────────────────────────
export function getTodaysOrders(lanchoneteId: string) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

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

  // 4. Número sequencial por tenant via função PG
  // UUID inválido causaria erro silencioso no cast ::uuid — validamos antes.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lid)) {
    throw new OrderValidationError("lanchonete_id inválido");
  }
  const seqResult = await prisma.$queryRaw<{ next_numero_pedido: number }[]>`
    SELECT next_numero_pedido(${lid}::uuid) AS next_numero_pedido
  `;
  const numeroPedido = seqResult[0].next_numero_pedido;

  // 5. Persistência
  return prisma.pedido.create({
    data: {
      lanchonete_id:   lid,
      usuario_id:      uid,
      numero_pedido:   numeroPedido,
      forma_pagamento: input.forma_pagamento as FormaPagamento,
      origem:          (input.origem as OrigemPedido) ?? "BALCAO",
      observacao:      input.observacao ?? null,
      subtotal,
      desconto:        0,
      total:           subtotal,
      itens: { create: itensData },
    },
    include: {
      cliente: true,
      itens:   { include: { adicionais: true } },
    },
  });
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
    await prisma.transacao.create({
      data: {
        lanchonete_id: lid,
        pedido_id:     id,
        usuario_id:    uid,
        tipo:          "RECEITA",
        categoria:     "Venda",
        descricao:     `Pedido #${pedido.numero_pedido}`,
        valor:         pedido.total,
      },
    });
  }

  return atualizado;
}
