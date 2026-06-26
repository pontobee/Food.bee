import { prisma }               from "@/lib/prisma";
import { type EvolutionConfig }  from "@/lib/evolution";
import { parsePayload, cleanJid, mapStatus } from "./payload";
import { processarMensagemBot }  from "./bot.service";

const BATCH    = 10;
const MAX_TENT = 3;

// Atomicamente reivindica um lote de eventos PENDENTE com SKIP LOCKED.
async function reivindicarLote(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE webhook_eventos
    SET    status     = 'PROCESSANDO',
           tentativas = tentativas + 1
    WHERE  id IN (
      SELECT id FROM webhook_eventos
      WHERE  status = 'PENDENTE'
      ORDER BY recebido_em ASC
      LIMIT  ${BATCH}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;
  return rows.map((r) => r.id);
}

interface LanchoneteCtx {
  lanchoneteId: string;
  cfg:          EvolutionConfig;
}

async function resolverLanchonete(instance: string): Promise<LanchoneteCtx | null> {
  const config = await prisma.whatsAppConfig.findFirst({
    where: { instance_nome: instance },
  });
  if (!config) return null;
  return {
    lanchoneteId: config.lanchonete_id,
    cfg: {
      url:      config.evolution_url,
      apiKey:   config.evolution_api_key,
      instance: config.instance_nome,
    },
  };
}

async function upsertCliente(lanchoneteId: string, telefone: string, nome: string) {
  return prisma.cliente.upsert({
    where:  { lanchonete_id_telefone: { lanchonete_id: lanchoneteId, telefone } },
    create: { lanchonete_id: lanchoneteId, telefone, nome },
    update: { nome },
    select: { id: true },
  });
}

async function processarEvento(id: string): Promise<void> {
  const evento = await prisma.webhookEvento.findUnique({ where: { id } });
  if (!evento) return;

  const parsed = parsePayload(evento.payload);

  if (parsed.type === "ignore") {
    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "IGNORADO", processado_em: new Date() },
    });
    return;
  }

  const ctx = await resolverLanchonete(parsed.instance);
  if (!ctx) {
    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "IGNORADO", processado_em: new Date() },
    });
    return;
  }

  if (parsed.type === "message_in") {
    const telefone = cleanJid(parsed.remoteJid);
    const cliente  = await upsertCliente(ctx.lanchoneteId, telefone, parsed.pushName);

    // Salva mensagem recebida para histórico
    await prisma.mensagemWhatsApp.upsert({
      where:  { id_mensagem_wpp: parsed.messageId },
      create: {
        lanchonete_id:   ctx.lanchoneteId,
        cliente_id:      cliente.id,
        numero_destino:  telefone,
        mensagem:        parsed.texto,
        tipo:            "CUSTOM",
        status:          "ENVIADO",
        id_mensagem_wpp: parsed.messageId,
        enviado_em:      new Date(parsed.ts * 1000),
      },
      update: {},
    });

    // Processa o bot de pedidos
    await processarMensagemBot(
      ctx.lanchoneteId,
      cliente.id,
      telefone,
      parsed.pushName,
      parsed.texto,
      ctx.cfg,
    );

    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "PROCESSADO", lanchonete_id: ctx.lanchoneteId, processado_em: new Date() },
    });
    return;
  }

  if (parsed.type === "message_update") {
    await prisma.mensagemWhatsApp.updateMany({
      where: { id_mensagem_wpp: parsed.messageId },
      data:  { status: mapStatus(parsed.status) },
    });
    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "PROCESSADO", lanchonete_id: ctx.lanchoneteId, processado_em: new Date() },
    });
  }
}

async function marcarErro(id: string, msg: string, tentativas: number) {
  const status = tentativas >= MAX_TENT ? "ERRO" : "PENDENTE";
  await prisma.webhookEvento.update({
    where: { id },
    data:  { status, erro_mensagem: msg.slice(0, 500) },
  });
}

export async function processarFila(): Promise<{ processados: number; erros: number }> {
  const ids = await reivindicarLote();
  if (ids.length === 0) return { processados: 0, erros: 0 };

  let processados = 0;
  let erros       = 0;

  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        await processarEvento(id);
        processados++;
      } catch (err) {
        erros++;
        const evento = await prisma.webhookEvento.findUnique({ where: { id }, select: { tentativas: true } });
        await marcarErro(id, String(err), evento?.tentativas ?? 0);
      }
    }),
  );

  return { processados, erros };
}
