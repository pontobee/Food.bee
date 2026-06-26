import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdicionais, createAdicional } from "@/modules/catalog/adicionais.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const produtoId = searchParams.get("produto_id") || undefined;

  try {
    const adicionais = await getAdicionais(session.user.lanchonete_id, produtoId);
    return NextResponse.json(adicionais);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar adicionais" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const adicional = await createAdicional(body, session.user.lanchonete_id);
    return NextResponse.json(adicional, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar adicional" }, { status: 500 });
  }
}
