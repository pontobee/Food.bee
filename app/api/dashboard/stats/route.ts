import { NextResponse }  from "next/server";
import { auth }          from "@/auth";
import { authGuard }     from "@/lib/auth-guards";
import { prisma }        from "@/lib/prisma";
import { startOfDayBRT } from "@/lib/timezone";

export async function GET() {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  const lid  = session!.user.lanchonete_id;
  const hoje = startOfDayBRT();

  // Webhooks pendentes há mais de 5 min ou com erro — indicativo de fila travada
  const limiteWebhook = new Date(Date.now() - 5 * 60 * 1000);

  const [pedidosHoje, estoqueAtivo, webhooksPendentes] = await Promise.all([
    prisma.pedido.findMany({
      where: { lanchonete_id: lid, inativo_em: null, criado_em: { gte: hoje } },
      select: { total: true, status: true },
    }),
    prisma.produto.findMany({
      where: { lanchonete_id: lid, inativo_em: null },
      select: { estoque_atual: true, estoque_minimo: true },
    }),
    prisma.webhookEvento.count({
      where: {
        lanchonete_id: lid,
        status: { in: ["PENDENTE", "ERRO"] },
        recebido_em: { lte: limiteWebhook },
      },
    }),
  ]);

  const entregues      = pedidosHoje.filter((p) => p.status === "ENTREGUE");
  const faturamento    = entregues.reduce((s, p) => s + Number(p.total), 0);
  const ticketMedio    = entregues.length ? faturamento / entregues.length : 0;
  const estoqueCritico = estoqueAtivo.filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  ).length;

  return NextResponse.json({
    pedidos_hoje:       pedidosHoje.length,
    faturamento_hoje:   faturamento,
    ticket_medio:       ticketMedio,
    estoque_critico:    estoqueCritico,
    webhooks_pendentes: webhooksPendentes,
  });
}
