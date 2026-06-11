import { NextRequest, NextResponse } from "next/server";
import { auth }    from "@/auth";
import { prisma }  from "@/lib/prisma";

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
  const body = await req.json();

  // Gera número sequencial via função PG
  const seqResult = await prisma.$queryRawUnsafe<{ next_numero_pedido: number }[]>(
    `SELECT next_numero_pedido($1::uuid) AS next_numero_pedido`,
    lid
  );
  const numeroPedido = seqResult[0].next_numero_pedido;

  const subtotal = (body.itens as any[]).reduce((acc: number, item: any) => {
    const extras = (item.adicionais ?? []).reduce(
      (s: number, a: any) => s + (a.tipo === "ADICIONAL" ? Number(a.preco_extra) : 0),
      0
    );
    return acc + (Number(item.preco_unitario) + extras) * Number(item.quantidade);
  }, 0);

  const pedido = await prisma.pedido.create({
    data: {
      lanchonete_id:   lid,
      usuario_id:      uid,
      numero_pedido:   numeroPedido,
      forma_pagamento: body.forma_pagamento,
      origem:          body.origem ?? "BALCAO",
      observacao:      body.observacao ?? null,
      subtotal,
      desconto:        0,
      total:           subtotal,
      itens: {
        create: (body.itens as any[]).map((item: any) => ({
          lanchonete_id:          lid,
          produto_id:             item.produto_id ?? null,
          produto_nome:           item.produto_nome,
          produto_preco_unitario: item.preco_unitario,
          quantidade:             item.quantidade,
          total: (() => {
            const extras = (item.adicionais ?? []).reduce(
              (s: number, a: any) => s + (a.tipo === "ADICIONAL" ? Number(a.preco_extra) : 0),
              0
            );
            return (Number(item.preco_unitario) + extras) * Number(item.quantidade);
          })(),
          adicionais: item.adicionais?.length
            ? {
                create: item.adicionais.map((a: any) => ({
                  lanchonete_id:        lid,
                  produto_adicional_id: a.produto_adicional_id ?? null,
                  nome:                 a.nome,
                  tipo:                 a.tipo,
                  preco_extra:          a.preco_extra ?? 0,
                })),
              }
            : undefined,
        })),
      },
    },
    include: {
      cliente: true,
      itens:   { include: { adicionais: true } },
    },
  });

  return NextResponse.json(pedido, { status: 201 });
}
