import { NextRequest, NextResponse } from "next/server";
import { auth }    from "@/auth";
import { prisma }  from "@/lib/prisma";
import { Prisma, FormaPagamento, OrigemPedido } from "@prisma/client";

const FORMAS_PAGAMENTO = new Set<string>(Object.values(FormaPagamento));
const ORIGENS_PEDIDO   = new Set<string>(Object.values(OrigemPedido));

interface ItemAdicionalInput {
  produto_adicional_id?: string;
}

interface ItemInput {
  produto_id?: string;
  quantidade?: number;
  adicionais?: ItemAdicionalInput[];
}

interface PedidoInput {
  itens?: ItemInput[];
  forma_pagamento?: string;
  origem?: string;
  observacao?: string | null;
}

// GET /api/pedidos — retorna pedidos do dia do tenant autenticado
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lid = session.user.lanchonete_id;
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const pedidos = await prisma.pedido.findMany({
    where: {
      lanchonete_id: lid,
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

  return NextResponse.json(pedidos);
}

// POST /api/pedidos — abre novo pedido
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lid = session.user.lanchonete_id;
  const uid = session.user.id!;

  let body: PedidoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const itensInput = body.itens;
  if (!Array.isArray(itensInput) || itensInput.length === 0) {
    return NextResponse.json({ error: "Pedido precisa de ao menos um item" }, { status: 400 });
  }
  if (!body.forma_pagamento || !FORMAS_PAGAMENTO.has(body.forma_pagamento)) {
    return NextResponse.json({ error: "forma_pagamento inválida" }, { status: 400 });
  }
  if (body.origem !== undefined && !ORIGENS_PEDIDO.has(body.origem)) {
    return NextResponse.json({ error: "origem inválida" }, { status: 400 });
  }
  for (const item of itensInput) {
    if (!item.produto_id || !Number.isInteger(item.quantidade) || (item.quantidade as number) < 1) {
      return NextResponse.json({ error: "Item de pedido inválido" }, { status: 400 });
    }
  }

  // Busca produtos e adicionais reais do tenant — preços nunca vêm do cliente
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

  let subtotal = new Prisma.Decimal(0);
  const itensData: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];

  for (const item of itensInput) {
    const produto = produtoMap.get(item.produto_id!);
    if (!produto) {
      return NextResponse.json({ error: `Produto ${item.produto_id} não encontrado` }, { status: 400 });
    }

    let extrasUnitario = new Prisma.Decimal(0);
    const adicionaisData: Prisma.ItemPedidoAdicionalUncheckedCreateWithoutItem_pedidoInput[] = [];
    for (const a of item.adicionais ?? []) {
      const adicional = a.produto_adicional_id ? adicionalMap.get(a.produto_adicional_id) : undefined;
      if (!adicional) {
        return NextResponse.json({ error: `Adicional ${a.produto_adicional_id} não encontrado` }, { status: 400 });
      }
      if (adicional.tipo === "ADICIONAL") extrasUnitario = extrasUnitario.add(adicional.preco_extra);
      adicionaisData.push({
        lanchonete_id: lid,
        produto_adicional_id: adicional.id,
        nome:        adicional.nome,
        tipo:        adicional.tipo,
        preco_extra: adicional.preco_extra,
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

  // Gera número sequencial via função PG
  const seqResult = await prisma.$queryRaw<{ next_numero_pedido: number }[]>`
    SELECT next_numero_pedido(${lid}::uuid) AS next_numero_pedido
  `;
  const numeroPedido = seqResult[0].next_numero_pedido;

  const pedido = await prisma.pedido.create({
    data: {
      lanchonete_id:   lid,
      usuario_id:      uid,
      numero_pedido:   numeroPedido,
      forma_pagamento: body.forma_pagamento as FormaPagamento,
      origem:          (body.origem as OrigemPedido) ?? "BALCAO",
      observacao:      body.observacao ?? null,
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

  return NextResponse.json(pedido, { status: 201 });
}
