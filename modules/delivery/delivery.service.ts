import { prisma } from "@/lib/prisma";

export interface TaxaInput {
  nome:      string;
  taxa:      number;
  tempo_min?: number | null;
}

export function listarTaxas(lanchoneteId: string) {
  return prisma.taxaEntrega.findMany({
    where:   { lanchonete_id: lanchoneteId, ativa: true },
    orderBy: { taxa: "asc" },
    select:  { id: true, nome: true, taxa: true, tempo_min: true },
  });
}

export function criarTaxa(data: TaxaInput, lanchoneteId: string) {
  return prisma.taxaEntrega.create({
    data: {
      lanchonete_id: lanchoneteId,
      nome:          data.nome.trim(),
      taxa:          data.taxa,
      tempo_min:     data.tempo_min ?? null,
    },
    select: { id: true, nome: true, taxa: true, tempo_min: true },
  });
}

export async function atualizarTaxa(id: string, data: Partial<TaxaInput>, lanchoneteId: string) {
  const existing = await prisma.taxaEntrega.findFirst({
    where: { id, lanchonete_id: lanchoneteId, ativa: true },
  });
  if (!existing) throw new Error("Taxa não encontrada");

  return prisma.taxaEntrega.update({
    where:  { id },
    data:   {
      nome:          data.nome?.trim() ?? existing.nome,
      taxa:          data.taxa          ?? existing.taxa,
      tempo_min:     data.tempo_min !== undefined ? data.tempo_min : existing.tempo_min,
      atualizado_em: new Date(),
    },
    select: { id: true, nome: true, taxa: true, tempo_min: true },
  });
}

export async function desativarTaxa(id: string, lanchoneteId: string) {
  const existing = await prisma.taxaEntrega.findFirst({
    where: { id, lanchonete_id: lanchoneteId, ativa: true },
  });
  if (!existing) throw new Error("Taxa não encontrada");

  return prisma.taxaEntrega.update({
    where: { id },
    data:  { ativa: false, atualizado_em: new Date() },
  });
}
