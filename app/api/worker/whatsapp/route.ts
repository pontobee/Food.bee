import { NextRequest, NextResponse } from "next/server";
import { processarFila } from "@/modules/whatsapp/worker.service";

function autenticado(req: NextRequest): boolean {
  const auth   = req.headers.get("authorization") ?? "";
  // Vercel Cron injeta automaticamente: Authorization: Bearer $CRON_SECRET
  const cron   = process.env.CRON_SECRET;
  // POST manual (ex: Railway cron, teste local): Authorization: Bearer $WORKER_SECRET
  const worker = process.env.WORKER_SECRET;
  return (!!cron && auth === `Bearer ${cron}`) || (!!worker && auth === `Bearer ${worker}`);
}

async function run(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const resultado = await processarFila();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    console.error("[worker/whatsapp]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Vercel Cron sempre faz GET
export const GET  = run;
// Chamada manual / externa faz POST
export const POST = run;
