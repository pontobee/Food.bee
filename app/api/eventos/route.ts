import { NextRequest, NextResponse } from "next/server";
import { z }          from "zod";
import type { Prisma } from "@prisma/client";
import { prisma }      from "@/lib/prisma";
import { logger }      from "@/lib/logger";

// Webhook da Evolution API — payload é um objeto livre, mas deve ser um objeto
const webhookSchema = z.record(z.string(), z.unknown());

// POST /api/eventos — receptor de webhooks da Evolution API (WhatsApp)
// Retorna 200 imediatamente (fire-and-forget). Worker processa a fila.
export async function POST(req: NextRequest) {
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

  // ID único fornecido pelo provider — garante idempotência via UNIQUE constraint
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
    // Violação UNIQUE = evento duplicado — ignora silenciosamente
    const isUniqueViolation =
      err instanceof Error && err.message.includes("Unique constraint");
    if (!isUniqueViolation) {
      logger.error("webhook", "erro ao persistir evento", err);
    }
  }

  // Sempre 200 — nunca deixa o provider retentar por falha de processamento
  return NextResponse.json({ ok: true });
}
