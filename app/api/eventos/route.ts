import { NextRequest, NextResponse } from "next/server";
import { z }          from "zod";
import type { Prisma } from "@prisma/client";
import { prisma }      from "@/lib/prisma";
import { logger }      from "@/lib/logger";

// Webhook da Evolution API — payload é um objeto livre, mas deve ser um objeto
const webhookSchema = z.record(z.string(), z.unknown());

// Valida o segredo de origem do webhook.
// Se EVOLUTION_WEBHOOK_SECRET estiver definido, o header Authorization: Bearer <secret>
// precisa coincidir. Se não estiver definido, aceita mas emite aviso.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("webhook", "EVOLUTION_WEBHOOK_SECRET não configurado — endpoint desprotegido");
    return true;
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  return token === secret;
}

// ── Rate limiter in-memory ────────────────────────────────────────
// Protege contra flood. Por ser in-process, funciona por instância serverless —
// suficiente combinado com a autenticação por secret abaixo.
const rl = new Map<string, { n: number; resetAt: number }>();
const RL_MAX = 1000; // requisições por janela
const RL_WIN = 60_000; // janela de 1 minuto (ms)

function permitido(ip: string): boolean {
  const now = Date.now();
  const e   = rl.get(ip);
  if (!e || now > e.resetAt) { rl.set(ip, { n: 1, resetAt: now + RL_WIN }); return true; }
  if (e.n >= RL_MAX) return false;
  e.n++;
  return true;
}

// ── Autenticação ──────────────────────────────────────────────────
// Configure na Evolution API: adicione o header "Authorization: Bearer $WHATSAPP_WEBHOOK_SECRET"
// ao webhook. Se a variável não estiver definida, aceita tudo (útil em dev).
function autenticado(req: NextRequest): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) return true; // dev: sem secret configurado, aceita tudo
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// ── Receptor ──────────────────────────────────────────────────────
// POST /api/eventos — retorna 200 imediatamente (fire-and-forget).
// Worker /api/worker/whatsapp processa a fila de forma assíncrona.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!permitido(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  if (!autenticado(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const body = parsed.data;

  const idExterno = String(body.id ?? body.event_id ?? body.messageId ?? crypto.randomUUID());

  try {
    await prisma.webhookEvento.create({
      data: {
        id_externo: idExterno,
        payload:    body as Prisma.JsonObject,
        status:     "PENDENTE",
      },
    });
  } catch (err: unknown) {
    const isUniqueViolation =
      err instanceof Error && err.message.includes("Unique constraint");
    if (!isUniqueViolation) {
      logger.error("webhook", "erro ao persistir evento", err);
    }
  }

  return NextResponse.json({ ok: true });
}
