import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProdutoById, updateProduto, deleteProduto } from "@/modules/catalog/produtos.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const produto = await getProdutoById(id, session.user.lanchonete_id);
    if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    
    // Esconder preco_custo para CAIXA
    if (session.user.role !== "ADMIN") {
       (produto as any).preco_custo = undefined;
    }

    return NextResponse.json(produto);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const atualizado = await updateProduto(id, body, session.user.lanchonete_id);
    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const inativado = await deleteProduto(id, session.user.lanchonete_id);
    return NextResponse.json(inativado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao deletar produto" }, { status: 500 });
  }
}
