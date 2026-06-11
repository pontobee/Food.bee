import { NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lid       = session.user.lanchonete_id;
  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0);

  const [pedidosHoje, estoqueAtivo] = await Promise.all([
    prisma.pedido.findMany({
      where: { lanchonete_id: lid, inativo_em: null, criado_em: { gte: hoje } },
      select: { total: true, status: true },
    }),
    prisma.produto.findMany({
      where: { lanchonete_id: lid, inativo_em: null },
      select: { estoque_atual: true, estoque_minimo: true },
    }),
  ]);

  const entregues      = pedidosHoje.filter((p) => p.status === "ENTREGUE");
  const faturamento    = entregues.reduce((s, p) => s + Number(p.total), 0);
  const ticketMedio    = entregues.length ? faturamento / entregues.length : 0;
  const estoqueCritico = estoqueAtivo.filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  ).length;

  return NextResponse.json({
    pedidos_hoje:     pedidosHoje.length,
    faturamento_hoje: faturamento,
    ticket_medio:     ticketMedio,
    estoque_critico:  estoqueCritico,
  });
}
