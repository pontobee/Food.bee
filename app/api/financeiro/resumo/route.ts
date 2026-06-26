import { NextResponse }                    from "next/server";
import { auth }                            from "@/auth";
import { adminGuard }                      from "@/lib/auth-guards";
import { prisma }                          from "@/lib/prisma";
import { startOfDayBRT, startOfMonthBRT } from "@/lib/timezone";

// GET /api/financeiro/resumo — resumo financeiro do mês/dia (somente ADMIN)
export async function GET() {
  const session = await auth();
  const guard = adminGuard(session);
  if (guard) return guard;

  const lid = session!.user.lanchonete_id;

  const inicioDia = startOfDayBRT();
  const inicioMes = startOfMonthBRT();

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
