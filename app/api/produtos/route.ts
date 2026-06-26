import { NextResponse } from "next/server";
import { auth }       from "@/auth";
import { authGuard }  from "@/lib/auth-guards";
import { prisma }     from "@/lib/prisma";

// GET /api/produtos — lista produtos ativos do tenant
export async function GET() {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  const produtos = await prisma.produto.findMany({
    where: {
      lanchonete_id: session!.user.lanchonete_id,
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
  const role = session!.user.role;
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
