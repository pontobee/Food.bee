import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { desconectar } from "@/lib/evolution";

export async function POST() {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.whatsAppConfig.findUnique({
    where: { lanchonete_id: session.user.lanchonete_id },
  });

  if (!config) return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 });

  try {
    await desconectar({ url: config.evolution_url, apiKey: config.evolution_api_key, instance: config.instance_nome });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
