import { prisma } from "@/lib/prisma";
import { TipoMovimentacaoEstoque } from "@prisma/client";
import {
  StockValidationError,
  StockNotFoundError,
  EstoqueInsuficienteError,
} from "@/modules/stock/stock.errors";

const TIPOS_MOVIMENTACAO = new Set<string>(Object.values(TipoMovimentacaoEstoque));

// ── Tipo de entrada (DTO vindo da API) ─────────────────────────
export interface MovimentarEstoqueInput {
  produto_id?: string;
  tipo?: string;          // "ENTRADA" | "SAIDA"
  quantidade?: number;    // sempre positivo
  motivo?: string | null;
}

/** Contexto do tenant autenticado — toda operação é isolada por lanchonete. */
interface TenantContext {
  lanchoneteId: string;
  usuarioId: string;
}

// ── Leitura: histórico recente de movimentações do tenant ──────
export function getMovimentacoes(lanchoneteId: string, limite = 30) {
  return prisma.movimentacaoEstoque.findMany({
    where: { lanchonete_id: lanchoneteId },
    include: {
      produto: { select: { id: true, nome: true, unidade: true } },
      usuario: { select: { id: true, nome: true } },
    },
    orderBy: { criado_em: "desc" },
    take: limite,
  });
}

// ── Escrita: registra uma entrada ou saída de estoque ──────────
// Regras garantidas aqui (nunca confie só no frontend):
//   1. quantidade precisa ser inteiro > 0;
//   2. tipo precisa ser ENTRADA ou SAIDA;
//   3. o produto precisa pertencer ao tenant (multitenancy);
//   4. o estoque NUNCA pode ficar negativo.
//
// O UPDATE do saldo e o INSERT do histórico acontecem dentro de uma
// transação ($transaction): ou os dois gravam, ou nenhum. Isso evita o
// cenário em que o saldo muda mas o extrato não registra (ou vice-versa).
export async function movimentarEstoque(
  input: MovimentarEstoqueInput,
  ctx: TenantContext
) {
  const { lanchoneteId: lid, usuarioId: uid } = ctx;

  // 1. Validação de entrada
  if (!input.produto_id) {
    throw new StockValidationError("produto_id é obrigatório");
  }
  if (!input.tipo || !TIPOS_MOVIMENTACAO.has(input.tipo)) {
    throw new StockValidationError("tipo inválido (use ENTRADA ou SAIDA)");
  }
  if (!Number.isInteger(input.quantidade) || (input.quantidade as number) <= 0) {
    throw new StockValidationError("quantidade precisa ser um inteiro maior que zero");
  }

  const tipo = input.tipo as TipoMovimentacaoEstoque;
  const quantidade = input.quantidade as number;
  // ENTRADA soma, SAIDA subtrai. O sinal nasce aqui, do tipo.
  const delta = tipo === "ENTRADA" ? quantidade : -quantidade;

  // 2. Tudo dentro de uma transação atômica
  return prisma.$transaction(async (tx) => {
    // Busca o produto do tenant (multitenancy + soft delete)
    const produto = await tx.produto.findFirst({
      where: { id: input.produto_id, lanchonete_id: lid, inativo_em: null },
      select: { id: true, estoque_atual: true },
    });
    if (!produto) throw new StockNotFoundError();

    const estoqueAntes = produto.estoque_atual;
    const estoqueDepois = estoqueAntes + delta;

    // 4. Trava de segurança: estoque não pode ficar negativo
    if (estoqueDepois < 0) {
      throw new EstoqueInsuficienteError(
        `Saída de ${quantidade} excede o estoque atual (${estoqueAntes})`
      );
    }

    // Atualiza o saldo do produto
    await tx.produto.update({
      where: { id: produto.id },
      data: { estoque_atual: estoqueDepois },
    });

    // Lança a movimentação no extrato (com snapshots antes/depois)
    return tx.movimentacaoEstoque.create({
      data: {
        lanchonete_id: lid,
        produto_id: produto.id,
        usuario_id: uid,
        tipo,
        quantidade,
        estoque_antes: estoqueAntes,
        estoque_depois: estoqueDepois,
        motivo: input.motivo?.trim() || null,
      },
      include: {
        produto: { select: { id: true, nome: true, unidade: true } },
      },
    });
  });
}
