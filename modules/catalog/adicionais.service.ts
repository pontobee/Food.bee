import { prisma } from "@/lib/prisma";
import { TipoAdicional } from "@prisma/client";

export interface AdicionalInput {
  produto_id?: string | null;
  nome: string;
  tipo: TipoAdicional;
  preco_extra?: number;
}

export function getAdicionais(lanchoneteId: string, produtoId?: string) {
  return prisma.produtoAdicional.findMany({
    where: { 
      lanchonete_id: lanchoneteId, 
      inativo_em: null,
      produto_id: produtoId || undefined, 
    },
    orderBy: { nome: "asc" },
  });
}

export function getAdicionalById(id: string, lanchoneteId: string) {
  return prisma.produtoAdicional.findFirst({
    where: { id, lanchonete_id: lanchoneteId, inativo_em: null },
  });
}

export function createAdicional(data: AdicionalInput, lanchoneteId: string) {
  return prisma.produtoAdicional.create({
    data: {
      ...data,
      lanchonete_id: lanchoneteId,
    },
  });
}

export async function updateAdicional(id: string, data: Partial<AdicionalInput>, lanchoneteId: string) {
  const existing = await getAdicionalById(id, lanchoneteId);
  if (!existing) throw new Error("Adicional não encontrado");

  return prisma.produtoAdicional.update({
    where: { id },
    data,
  });
}

export async function deleteAdicional(id: string, lanchoneteId: string) {
  const existing = await getAdicionalById(id, lanchoneteId);
  if (!existing) throw new Error("Adicional não encontrado");

  return prisma.produtoAdicional.update({
    where: { id },
    data: { inativo_em: new Date() },
  });
}
