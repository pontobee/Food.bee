import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buscarQrCode, criarInstancia } from "@/lib/evolution";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.whatsAppConfig.findUnique({
    where: { lanchonete_id: session.user.lanchonete_id },
  });

  if (!config) return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 });

  const cfg = { url: config.evolution_url, apiKey: config.evolution_api_key, instance: config.instance_nome };

  try {
    const data = await buscarQrCode(cfg);
    return NextResponse.json(data);
  } catch {
    // Instância pode não existir ainda — tenta criar e busca novamente
    try {
      await criarInstancia(cfg);
      const data = await buscarQrCode(cfg);
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }
}
