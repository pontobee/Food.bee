import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdicionalById, updateAdicional, deleteAdicional } from "@/modules/catalog/adicionais.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const adicional = await getAdicionalById(id, session.user.lanchonete_id);
    if (!adicional) return NextResponse.json({ error: "Adicional não encontrado" }, { status: 404 });
    return NextResponse.json(adicional);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar adicional" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const atualizado = await updateAdicional(id, body, session.user.lanchonete_id);
    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar adicional" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const inativado = await deleteAdicional(id, session.user.lanchonete_id);
    return NextResponse.json(inativado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao deletar adicional" }, { status: 500 });
  }
}
