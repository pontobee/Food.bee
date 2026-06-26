import { prisma }          from "@/lib/prisma";
import { enviarMensagem }  from "@/lib/evolution";

type StatusNotificavel = "PRONTO" | "CANCELADO";

const NOTIFICAVEIS = new Set<string>(["PRONTO", "CANCELADO"]);

function gerarTexto(status: StatusNotificavel, nome: string, numero: number, delivery: boolean): string {
  if (status === "PRONTO") {
    return delivery
      ? `🛵 Olá, ${nome}! Seu pedido *#${numero}* saiu para entrega. Fique de olho! 😊`
      : `🍔 Olá, ${nome}! Seu pedido *#${numero}* está pronto. Pode vir retirar no balcão! 😊`;
  }
  return `😕 Olá, ${nome}. Seu pedido *#${numero}* foi cancelado. Entre em contato conosco para mais informações.`;
}

// Chamada fire-and-forget após atualização de status.
// Falhas de envio são logadas mas não propagadas — não devem travar o fluxo do pedido.
export async function notificarCliente(
  pedidoId:     string,
  lanchoneteId: string,
  novoStatus:   string,
): Promise<void> {
  if (!NOTIFICAVEIS.has(novoStatus)) return;

  const [pedido, config] = await Promise.all([
    prisma.pedido.findUnique({
      where:  { id: pedidoId },
      select: {
        numero_pedido: true,
        tipo_entrega:  true,
        cliente_id:    true,
        cliente:       { select: { nome: true, telefone: true } },
      },
    }),
    prisma.whatsAppConfig.findUnique({
      where: { lanchonete_id: lanchoneteId },
    }),
  ]);

  if (!pedido?.cliente?.telefone || !config) return;

  const { nome, telefone } = pedido.cliente;
  const delivery = pedido.tipo_entrega === "DELIVERY";
  const texto    = gerarTexto(novoStatus as StatusNotificavel, nome, pedido.numero_pedido, delivery);
  const tipo     = novoStatus === "PRONTO" ? "PEDIDO_PRONTO" : "PEDIDO_CANCELADO";

  try {
    const res = await enviarMensagem(
      { url: config.evolution_url, apiKey: config.evolution_api_key, instance: config.instance_nome },
      telefone,
      texto,
    );

    await prisma.mensagemWhatsApp.create({
      data: {
        lanchonete_id:   lanchoneteId,
        cliente_id:      pedido.cliente_id,
        numero_destino:  telefone,
        mensagem:        texto,
        tipo,
        id_mensagem_wpp: res?.key?.id ?? null,
      },
    });
  } catch (err) {
    console.error("[notificacao] falha ao enviar WhatsApp:", err);
  }
}
