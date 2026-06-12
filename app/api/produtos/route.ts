import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";
import { createProduto } from "@/modules/catalog/produtos.service";

// GET /api/produtos — lista produtos ativos do tenant
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const produtos = await prisma.produto.findMany({
    where: {
      lanchonete_id: session.user.lanchonete_id,
      inativo_em:    null,
    },
    include: {
      categoria: { select: { id: true, nome: true } },
      adicionais: {
        where:  { inativo_em: null },
        select: { id: true, nome: true, tipo: true, preco_extra: true },
      },
    },
    orderBy: [{ categoria: { ordem: "asc" } }, { nome: "asc" }],
  });

  // Remove preco_custo para CAIXA
  const role = session.user.role;
  const data = produtos.map((p) => ({
    ...p,
    preco_custo: role === "ADMIN" ? Number(p.preco_custo) : undefined,
    preco_venda: Number(p.preco_venda),
    adicionais: p.adicionais.map((a) => ({
      ...a,
      preco_extra: Number(a.preco_extra),
    })),
  }));

  return NextResponse.json(data);
}

// POST /api/produtos — cria novo produto (somente ADMIN)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const produto = await createProduto(body, session.user.lanchonete_id);
    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar produto" }, { status: 500 });
  }
}
