import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/eventos — receptor de webhooks da Evolution API (WhatsApp)
// Retorna 200 imediatamente (fire-and-forget). Worker processa a fila.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // ID único fornecido pelo provider — garante idempotência via UNIQUE constraint
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
    // Violação UNIQUE = evento duplicado — ignora silenciosamente
    const isUniqueViolation =
      err instanceof Error && err.message.includes("Unique constraint");
    if (!isUniqueViolation) {
      console.error("[webhook] erro ao persistir:", err);
    }
  }

  // Sempre 200 — nunca deixa o provider retentar por falha de processamento
  return NextResponse.json({ ok: true });
}
