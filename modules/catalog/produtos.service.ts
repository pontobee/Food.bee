import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProdutoInput {
  categoria_id?: string | null;
  nome: string;
  descricao?: string;
  preco_venda: number;
  preco_custo?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  controlar_estoque?: boolean;
  unidade?: string;
  imagem_url?: string;
}

export function getProdutoById(id: string, lanchoneteId: string) {
  return prisma.produto.findFirst({
    where: { id, lanchonete_id: lanchoneteId, inativo_em: null },
    include: {
      categoria: { select: { id: true, nome: true } },
      adicionais: {
        where: { inativo_em: null },
        select: { id: true, nome: true, tipo: true, preco_extra: true },
      },
    },
  });
}

export function createProduto(data: ProdutoInput, lanchoneteId: string) {
  return prisma.produto.create({
    data: {
      ...data,
      lanchonete_id: lanchoneteId,
    },
  });
}

export async function updateProduto(id: string, data: Partial<ProdutoInput>, lanchoneteId: string) {
  const existing = await prisma.produto.findFirst({
    where: { id, lanchonete_id: lanchoneteId, inativo_em: null },
  });
  if (!existing) throw new Error("Produto não encontrado");

  return prisma.produto.update({
    where: { id },
    data,
  });
}

export async function deleteProduto(id: string, lanchoneteId: string) {
  const existing = await prisma.produto.findFirst({
    where: { id, lanchonete_id: lanchoneteId, inativo_em: null },
  });
  if (!existing) throw new Error("Produto não encontrado");

  return prisma.produto.update({
    where: { id },
    data: { inativo_em: new Date() },
  });
}
