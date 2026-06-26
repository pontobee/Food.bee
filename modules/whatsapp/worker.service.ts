import { prisma } from "@/lib/prisma";
import { parsePayload, cleanJid, mapStatus } from "./payload";

const BATCH    = 10;
const MAX_TENT = 3;

// Atomicamente reivindica um lote de eventos PENDENTE usando SKIP LOCKED
// para suportar múltiplos workers sem duplicação.
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

async function resolverLanchonete(instance: string): Promise<string | null> {
  const cfg = await prisma.whatsAppConfig.findFirst({
    where:  { instance_nome: instance },
    select: { lanchonete_id: true },
  });
  return cfg?.lanchonete_id ?? null;
}

async function upsertCliente(lanchoneteId: string, telefone: string, nome: string) {
  return prisma.cliente.upsert({
    where:  { lanchonete_id_telefone: { lanchonete_id: lanchoneteId, telefone } },
    create: { lanchonete_id: lanchoneteId, telefone, nome },
    update: { nome },             // atualiza nome caso mude no WhatsApp
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

  const lanchoneteId = await resolverLanchonete(parsed.instance);
  if (!lanchoneteId) {
    // instância não reconhecida — ignora sem punir (pode ser config desatualizada)
    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "IGNORADO", processado_em: new Date() },
    });
    return;
  }

  if (parsed.type === "message_in") {
    const telefone = cleanJid(parsed.remoteJid);
    const cliente  = await upsertCliente(lanchoneteId, telefone, parsed.pushName);

    // Salva a mensagem recebida para histórico (tipo CUSTOM = entrada genérica)
    await prisma.mensagemWhatsApp.upsert({
      where:  { id_mensagem_wpp: parsed.messageId },
      create: {
        lanchonete_id:   lanchoneteId,
        cliente_id:      cliente.id,
        numero_destino:  telefone,
        mensagem:        parsed.texto,
        tipo:            "CUSTOM",
        status:          "ENVIADO",
        id_mensagem_wpp: parsed.messageId,
        enviado_em:      new Date(parsed.ts * 1000),
      },
      update: {},  // idempotência: não sobrescreve se já existe
    });

    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "PROCESSADO", lanchonete_id: lanchoneteId, processado_em: new Date() },
    });
    return;
  }

  if (parsed.type === "message_update") {
    const novoStatus = mapStatus(parsed.status);
    await prisma.mensagemWhatsApp.updateMany({
      where: { id_mensagem_wpp: parsed.messageId },
      data:  { status: novoStatus },
    });

    await prisma.webhookEvento.update({
      where: { id },
      data:  { status: "PROCESSADO", lanchonete_id: lanchoneteId, processado_em: new Date() },
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
