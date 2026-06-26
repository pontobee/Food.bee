import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.whatsAppConfig.findUnique({
    where:  { lanchonete_id: session.user.lanchonete_id },
    select: { evolution_url: true, instance_nome: true },
  });

  return NextResponse.json(config ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { evolution_url?: string; evolution_api_key?: string; instance_nome?: string };

  if (!body.evolution_url?.trim() || !body.evolution_api_key?.trim() || !body.instance_nome?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios: evolution_url, evolution_api_key, instance_nome" }, { status: 400 });
  }

  const config = await prisma.whatsAppConfig.upsert({
    where:  { lanchonete_id: session.user.lanchonete_id },
    create: {
      lanchonete_id:     session.user.lanchonete_id,
      evolution_url:     body.evolution_url.trim().replace(/\/$/, ""),
      evolution_api_key: body.evolution_api_key.trim(),
      instance_nome:     body.instance_nome.trim(),
    },
    update: {
      evolution_url:     body.evolution_url.trim().replace(/\/$/, ""),
      evolution_api_key: body.evolution_api_key.trim(),
      instance_nome:     body.instance_nome.trim(),
    },
    select: { evolution_url: true, instance_nome: true },
  });

  return NextResponse.json(config);
}
