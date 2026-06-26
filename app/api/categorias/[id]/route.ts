import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategoriaById, updateCategoria, deleteCategoria } from "@/modules/catalog/categorias.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const categoria = await getCategoriaById(id, session.user.lanchonete_id);
    if (!categoria) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const atualizada = await updateCategoria(id, body, session.user.lanchonete_id);
    return NextResponse.json(atualizada);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const inativada = await deleteCategoria(id, session.user.lanchonete_id);
    return NextResponse.json(inativada);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao deletar categoria" }, { status: 500 });
  }
}
