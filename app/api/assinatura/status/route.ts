import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assinatura = await prisma.assinatura.findUnique({
    where:  { lanchonete_id: session.user.lanchonete_id },
    select: { status: true, plano: true, data_vencimento: true },
  });

  return NextResponse.json(assinatura);
}
