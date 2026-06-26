import { NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lid = session.user.lanchonete_id;

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
  seteDiasAtras.setHours(0, 0, 0, 0);

  const [pedidosUltimos7d, topProdutos, formasPagamento] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        lanchonete_id: lid,
        inativo_em:    null,
        status:        "ENTREGUE",
        criado_em:     { gte: seteDiasAtras },
      },
      select: { total: true, criado_em: true },
    }),

    prisma.itemPedido.groupBy({
      by:      ["produto_nome"],
      where:   {
        lanchonete_id: lid,
        pedido:        { status: "ENTREGUE", inativo_em: null },
      },
      _sum:    { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take:    5,
    }),

    prisma.pedido.groupBy({
      by:      ["forma_pagamento"],
      where:   {
        lanchonete_id: lid,
        inativo_em:    null,
        status:        "ENTREGUE",
        criado_em:     { gte: seteDiasAtras },
      },
      _count: { id: true },
    }),
  ]);

  // Monta mapa com todos os 7 dias (garante dias sem pedidos apareçam zerados)
  const diasMap = new Map<string, { receita: number; pedidos: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    diasMap.set(
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      { receita: 0, pedidos: 0 },
    );
  }

  for (const p of pedidosUltimos7d) {
    const key   = new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const entry = diasMap.get(key);
    if (entry) { entry.receita += Number(p.total); entry.pedidos += 1; }
  }

  const faturamento7d = Array.from(diasMap.entries()).map(([name, v]) => ({
    name,
    receita: Math.round(v.receita * 100) / 100,
    pedidos: v.pedidos,
  }));

  const top5Produtos = topProdutos.map((p) => ({
    nome:       p.produto_nome.length > 18 ? p.produto_nome.slice(0, 16) + "…" : p.produto_nome,
    quantidade: p._sum.quantidade ?? 0,
  }));

  const LABELS: Record<string, string> = {
    DINHEIRO:       "Dinheiro",
    CARTAO_DEBITO:  "Débito",
    CARTAO_CREDITO: "Crédito",
    PIX:            "Pix",
  };

  const pagamentos = formasPagamento.map((f) => ({
    name:  LABELS[f.forma_pagamento] ?? f.forma_pagamento,
    value: f._count.id,
  }));

  return NextResponse.json({ faturamento7d, top5Produtos, pagamentos });
}
