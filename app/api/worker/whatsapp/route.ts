import { NextRequest, NextResponse } from "next/server";
import { processarFila } from "@/modules/whatsapp/worker.service";

// POST /api/worker/whatsapp
// Chamado por cron externo (Vercel Cron, Railway, etc.) a cada minuto.
// Protegido por Authorization: Bearer $WORKER_SECRET
export async function POST(req: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret) {
    console.error("[worker] WORKER_SECRET não definido");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await processarFila();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    console.error("[worker] falha geral:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
