// Tipos e parsers do payload da Evolution API v2

export type EvolutionEvent =
  | { type: "message_in";    instance: string; remoteJid: string; messageId: string; pushName: string; texto: string;    ts: number }
  | { type: "message_update"; instance: string; remoteJid: string; messageId: string; status: number }
  | { type: "ignore" };

type Payload = Record<string, unknown>;

function str(v: unknown): string { return typeof v === "string" ? v : ""; }
function num(v: unknown): number { return typeof v === "number" ? v : 0; }
function obj(v: unknown): Payload { return v && typeof v === "object" && !Array.isArray(v) ? v as Payload : {}; }

function extractText(message: unknown): string {
  const m = obj(message);
  return (
    str(m.conversation) ||
    str(obj(m.extendedTextMessage).text) ||
    str(obj(m.imageMessage).caption) ||
    str(obj(m.videoMessage).caption) ||
    str(obj(m.documentMessage).caption) ||
    "[mídia]"
  );
}

// Número limpo: "5511999999999@s.whatsapp.net" → "5511999999999"
export function cleanJid(jid: string): string {
  return jid.split("@")[0].split(":")[0];
}

export function parsePayload(raw: unknown): EvolutionEvent {
  const p     = obj(raw);
  const event = str(p.event);
  const instance = str(p.instance);

  if (event === "messages.upsert") {
    const data = obj(p.data);
    const key  = obj(data.key);
    const jid  = str(key.remoteJid);

    // Ignora grupos e mensagens enviadas pelo próprio bot
    if (jid.endsWith("@g.us") || key.fromMe === true) return { type: "ignore" };

    return {
      type:      "message_in",
      instance,
      remoteJid: jid,
      messageId: str(key.id),
      pushName:  str(data.pushName) || "Cliente",
      texto:     extractText(data.message),
      ts:        num(data.messageTimestamp),
    };
  }

  if (event === "messages.update") {
    const updates = Array.isArray(p.data) ? p.data : [p.data];
    const first   = obj(updates[0]);
    const key     = obj(first.key);
    const update  = obj(first.update);
    const jid     = str(key.remoteJid);

    if (jid.endsWith("@g.us")) return { type: "ignore" };

    return {
      type:      "message_update",
      instance,
      remoteJid: jid,
      messageId: str(key.id),
      status:    num(update.status),
    };
  }

  return { type: "ignore" };
}

// Converte status numérico da Evolution API para enum do banco
export function mapStatus(s: number): "ENVIADO" | "ENTREGUE" | "LIDO" | "FALHOU" {
  if (s === 0)      return "FALHOU";
  if (s === 3)      return "ENTREGUE";
  if (s >= 4)       return "LIDO";
  return "ENVIADO";
}
