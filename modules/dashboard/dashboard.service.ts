import { prisma }        from "@/lib/prisma";
import { startOfDayBRT } from "@/lib/timezone";

export interface DashboardStats {
  pedidos_hoje:       number;
  faturamento_hoje:   number;
  ticket_medio:       number;
  estoque_critico:    number;
  webhooks_pendentes: number;
}

export async function getDashboardStats(lanchoneteId: string): Promise<DashboardStats> {
  const hoje = startOfDayBRT();
  // Webhooks pendentes há mais de 5 min — indicativo de fila travada
  const limiteWebhook = new Date(Date.now() - 5 * 60 * 1000);

  const [pedidosHoje, estoqueAtivo, webhooksPendentes] = await Promise.all([
    prisma.pedido.findMany({
      where: { lanchonete_id: lanchoneteId, inativo_em: null, criado_em: { gte: hoje } },
      select: { total: true, status: true },
    }),
    prisma.produto.findMany({
      where: { lanchonete_id: lanchoneteId, inativo_em: null },
      select: { estoque_atual: true, estoque_minimo: true },
    }),
    prisma.webhookEvento.count({
      where: {
        lanchonete_id: lanchoneteId,
        status: { in: ["PENDENTE", "ERRO"] },
        recebido_em: { lte: limiteWebhook },
      },
    }),
  ]);

  const entregues    = pedidosHoje.filter((p) => p.status === "ENTREGUE");
  const faturamento  = entregues.reduce((s, p) => s + Number(p.total), 0);

  return {
    pedidos_hoje:       pedidosHoje.length,
    faturamento_hoje:   faturamento,
    ticket_medio:       entregues.length ? faturamento / entregues.length : 0,
    estoque_critico:    estoqueAtivo.filter((p) => p.estoque_atual <= p.estoque_minimo).length,
    webhooks_pendentes: webhooksPendentes,
  };
}
