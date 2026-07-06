import { prisma }                          from "@/lib/prisma";
import { startOfDayBRT, startOfMonthBRT } from "@/lib/timezone";

export interface ResumoFinanceiro {
  receita_mes:  number;
  despesa_mes:  number;
  lucro_mes:    number;
  receita_hoje: number;
}

export async function getResumoFinanceiro(lanchoneteId: string): Promise<ResumoFinanceiro> {
  const inicioDia = startOfDayBRT();
  const inicioMes = startOfMonthBRT();

  const [receitaMes, despesaMes, receitaHoje] = await Promise.all([
    prisma.transacao.aggregate({
      where: { lanchonete_id: lanchoneteId, tipo: "RECEITA", inativo_em: null, data: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.transacao.aggregate({
      where: { lanchonete_id: lanchoneteId, tipo: "DESPESA", inativo_em: null, data: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.transacao.aggregate({
      where: { lanchonete_id: lanchoneteId, tipo: "RECEITA", inativo_em: null, data: { gte: inicioDia } },
      _sum: { valor: true },
    }),
  ]);

  const receita_mes = receitaMes._sum.valor?.toNumber() ?? 0;
  const despesa_mes = despesaMes._sum.valor?.toNumber() ?? 0;

  return {
    receita_mes,
    despesa_mes,
    lucro_mes:    receita_mes - despesa_mes,
    receita_hoje: receitaHoje._sum.valor?.toNumber() ?? 0,
  };
}
