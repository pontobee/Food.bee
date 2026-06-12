import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CategoriaInput {
  nome: string;
  descricao?: string;
  ordem?: number;
}

export function getCategorias(lanchoneteId: string) {
  return prisma.categoria.findMany({
    where: { lanchonete_id: lanchoneteId, inativo_em: null },
    orderBy: { ordem: "asc" },
  });
}

export function getCategoriaById(id: string, lanchoneteId: string) {
  return prisma.categoria.findFirst({
    where: { id, lanchonete_id: lanchoneteId, inativo_em: null },
  });
}

export function createCategoria(data: CategoriaInput, lanchoneteId: string) {
  return prisma.categoria.create({
    data: {
      ...data,
      lanchonete_id: lanchoneteId,
    },
  });
}

export async function updateCategoria(id: string, data: Partial<CategoriaInput>, lanchoneteId: string) {
  const existing = await getCategoriaById(id, lanchoneteId);
  if (!existing) throw new Error("Categoria não encontrada");

  return prisma.categoria.update({
    where: { id },
    data,
  });
}

export async function deleteCategoria(id: string, lanchoneteId: string) {
  const existing = await getCategoriaById(id, lanchoneteId);
  if (!existing) throw new Error("Categoria não encontrada");

  return prisma.categoria.update({
    where: { id },
    data: { inativo_em: new Date() },
  });
}
