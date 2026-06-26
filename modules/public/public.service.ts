import { prisma }        from "@/lib/prisma";
import { Prisma, FormaPagamento } from "@prisma/client";
import { OrderValidationError }  from "@/modules/orders/orders.errors";

// ── Cardápio público ───────────────────────────────────────────
// Retorna apenas dados seguros para o cliente final (sem preco_custo, etc.)
export async function getCardapio(slug: string) {
  const lanchonete = await prisma.lanchonete.findUnique({
    where:  { slug, inativo_em: null },
    select: { id: true, nome: true, logo_url: true, telefone: true },
  });
  if (!lanchonete) return null;

  const [categorias, produtos, adicionais] = await Promise.all([
    prisma.categoria.findMany({
      where:   { lanchonete_id: lanchonete.id, inativo_em: null },
      select:  { id: true, nome: true, ordem: true },
      orderBy: { ordem: "asc" },
    }),

    prisma.produto.findMany({
      where:   { lanchonete_id: lanchonete.id, inativo_em: null },
      select:  {
        id: true, nome: true, descricao: true,
        preco_venda: true, imagem_url: true, categoria_id: true,
      },
      orderBy: { nome: "asc" },
    }),

    prisma.produtoAdicional.findMany({
      where:   { lanchonete_id: lanchonete.id, inativo_em: null },
      select:  { id: true, produto_id: true, nome: true, tipo: true, preco_extra: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return { lanchonete, categorias, produtos, adicionais };
}

// ── Criar pedido público ───────────────────────────────────────
interface ItemPublicoInput {
  produto_id:  string;
  quantidade:  number;
  adicionais?: { produto_adicional_id?: string }[];
}

export interface CriarPedidoPublicoInput {
  itens:           ItemPublicoInput[];
  forma_pagamento: string;
  observacao?:     string | null;
  cliente_nome?:   string;
  cliente_tel?:    string;
}

const FORMAS_VALIDAS = new Set(["DINHEIRO", "CARTAO_DEBITO", "CARTAO_CREDITO", "PIX"]);

export async function createPublicOrder(slug: string, input: CriarPedidoPublicoInput) {
  // 1. Resolve lanchonete
  const lanchonete = await prisma.lanchonete.findUnique({
    where:  { slug, inativo_em: null },
    select: { id: true },
  });
  if (!lanchonete) throw new OrderValidationError("Lanchonete não encontrada");

  const lid = lanchonete.id;

  // 2. Validações básicas
  if (!Array.isArray(input.itens) || input.itens.length === 0)
    throw new OrderValidationError("Pedido precisa de ao menos um item");
  if (!FORMAS_VALIDAS.has(input.forma_pagamento))
    throw new OrderValidationError("Forma de pagamento inválida");

  for (const item of input.itens) {
    if (!item.produto_id || !Number.isInteger(item.quantidade) || item.quantidade < 1)
      throw new OrderValidationError("Item inválido");
  }

  // 3. Busca o usuário ADMIN do tenant para associar ao pedido (FK obrigatória)
  const adminUser = await prisma.usuario.findFirst({
    where:  { lanchonete_id: lid, role: "ADMIN", inativo_em: null },
    select: { id: true },
  });
  if (!adminUser) throw new OrderValidationError("Lanchonete sem usuário configurado");

  // 4. Resolve produtos e adicionais (nunca confia nos preços do cliente)
  const produtoIds = [...new Set(input.itens.map((i) => i.produto_id))];
  const produtos   = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, lanchonete_id: lid, inativo_em: null },
  });
  const produtoMap = new Map(produtos.map((p) => [p.id, p]));

  const adicionalIds = [
    ...new Set(
      input.itens.flatMap((i) =>
        (i.adicionais ?? [])
          .map((a) => a.produto_adicional_id)
          .filter((id): id is string => !!id)
      )
    ),
  ];
  const adicionaisDb  = adicionalIds.length
    ? await prisma.produtoAdicional.findMany({
        where: { id: { in: adicionalIds }, lanchonete_id: lid, inativo_em: null },
      })
    : [];
  const adicionalMap  = new Map(adicionaisDb.map((a) => [a.id, a]));

  // 5. Recálculo de preços no servidor
  let subtotal = new Prisma.Decimal(0);
  const itensData: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];

  for (const item of input.itens) {
    const produto = produtoMap.get(item.produto_id);
    if (!produto) throw new OrderValidationError(`Produto ${item.produto_id} não encontrado`);

    let extrasUnitario = new Prisma.Decimal(0);
    const adicionaisData: Prisma.ItemPedidoAdicionalUncheckedCreateWithoutItem_pedidoInput[] = [];

    for (const a of item.adicionais ?? []) {
      const adicional = a.produto_adicional_id ? adicionalMap.get(a.produto_adicional_id) : undefined;
      if (!adicional) throw new OrderValidationError(`Adicional não encontrado`);
      if (adicional.tipo === "ADICIONAL") extrasUnitario = extrasUnitario.add(adicional.preco_extra);
      adicionaisData.push({
        lanchonete_id:        lid,
        produto_adicional_id: adicional.id,
        nome:                 adicional.nome,
        tipo:                 adicional.tipo,
        preco_extra:          adicional.preco_extra,
      });
    }

    const totalItem = produto.preco_venda.add(extrasUnitario).mul(item.quantidade);
    subtotal = subtotal.add(totalItem);

    itensData.push({
      lanchonete_id:          lid,
      produto_id:             produto.id,
      produto_nome:           produto.nome,
      produto_preco_unitario: produto.preco_venda,
      quantidade:             item.quantidade,
      total:                  totalItem,
      adicionais:             adicionaisData.length ? { create: adicionaisData } : undefined,
    });
  }

  // 6. Upsert de cliente (opcional — somente se nome+telefone fornecidos)
  let clienteId: string | undefined;
  if (input.cliente_nome?.trim() && input.cliente_tel?.trim()) {
    const tel = input.cliente_tel.replace(/\D/g, "");
    const cliente = await prisma.cliente.upsert({
      where:  { lanchonete_id_telefone: { lanchonete_id: lid, telefone: tel } },
      update: { nome: input.cliente_nome.trim() },
      create: { lanchonete_id: lid, nome: input.cliente_nome.trim(), telefone: tel },
      select: { id: true },
    });
    clienteId = cliente.id;
  }

  // 7. Número sequencial por tenant
  const seqResult = await prisma.$queryRaw<{ next_numero_pedido: number }[]>`
    SELECT next_numero_pedido(${lid}::uuid) AS next_numero_pedido
  `;
  const numeroPedido = seqResult[0].next_numero_pedido;

  // 8. Persistência
  const pedido = await prisma.pedido.create({
    data: {
      lanchonete_id:   lid,
      usuario_id:      adminUser.id,
      cliente_id:      clienteId ?? null,
      numero_pedido:   numeroPedido,
      forma_pagamento: input.forma_pagamento as FormaPagamento,
      origem:          "CARDAPIO_DIGITAL",
      observacao:      input.observacao ?? null,
      subtotal,
      desconto:        0,
      total:           subtotal,
      itens:           { create: itensData },
    },
    select: {
      numero_pedido: true,
      total:         true,
      forma_pagamento: true,
    },
  });

  return pedido;
}
