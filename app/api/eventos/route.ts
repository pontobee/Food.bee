import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const idExterno = (body.id ?? body.event_id ?? body.messageId ?? crypto.randomUUID()) as string;

  try {
    await prisma.webhookEvento.create({
      data: {
        id_externo: String(idExterno),
        // eslint-disable-next-line
        payload:    body as any,
        status:     "PENDENTE",
      },
    });
  } catch (err: unknown) {
    const isUniqueViolation =
      err instanceof Error && err.message.includes("Unique constraint");
    if (!isUniqueViolation) {
      console.error("[webhook] erro ao persistir:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
