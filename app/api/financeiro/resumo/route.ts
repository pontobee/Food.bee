import { NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro/resumo — resumo financeiro do mês/dia (somente ADMIN)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lid = session.user.lanchonete_id;

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [receitaMes, despesaMes, receitaHoje] = await Promise.all([
    prisma.transacao.aggregate({
      where: { lanchonete_id: lid, tipo: "RECEITA", inativo_em: null, data: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.transacao.aggregate({
      where: { lanchonete_id: lid, tipo: "DESPESA", inativo_em: null, data: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.transacao.aggregate({
      where: { lanchonete_id: lid, tipo: "RECEITA", inativo_em: null, data: { gte: inicioDia } },
      _sum: { valor: true },
    }),
  ]);

  const receita_mes = receitaMes._sum.valor?.toNumber() ?? 0;
  const despesa_mes = despesaMes._sum.valor?.toNumber() ?? 0;

  return NextResponse.json({
    receita_mes,
    despesa_mes,
    lucro_mes:    receita_mes - despesa_mes,
    receita_hoje: receitaHoje._sum.valor?.toNumber() ?? 0,
  });
}
