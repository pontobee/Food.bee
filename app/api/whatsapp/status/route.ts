import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buscarStatus } from "@/lib/evolution";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.whatsAppConfig.findUnique({
    where: { lanchonete_id: session.user.lanchonete_id },
  });

  if (!config) return NextResponse.json({ state: "not_configured" });

  try {
    const { state } = await buscarStatus({
      url:      config.evolution_url,
      apiKey:   config.evolution_api_key,
      instance: config.instance_nome,
    });
    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ state: "error" });
  }
}
