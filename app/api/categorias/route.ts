import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategorias, createCategoria } from "@/modules/catalog/categorias.service";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categorias = await getCategorias(session.user.lanchonete_id);
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const categoria = await createCategoria(body, session.user.lanchonete_id);
    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
