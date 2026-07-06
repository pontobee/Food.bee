import { NextRequest, NextResponse } from "next/server";
import { auth }       from "@/auth";
import { authGuard }  from "@/lib/auth-guards";
import {
  movimentarEstoque,
  getMovimentacoes,
  type MovimentarEstoqueInput,
} from "@/modules/stock/stock.service";
import {
  StockValidationError,
  StockNotFoundError,
  EstoqueInsuficienteError,
} from "@/modules/stock/stock.errors";

// GET /api/estoque/movimentacao — histórico recente do tenant.
// ADMIN e CAIXA podem ver (operação de balcão).
export async function GET() {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  const movimentacoes = await getMovimentacoes(session!.user.lanchonete_id);
  return NextResponse.json(movimentacoes);
}

// POST /api/estoque/movimentacao — registra entrada ou saída.
// ADMIN e CAIXA podem movimentar; a regra anti-estoque-negativo vive no service.
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  let body: MovimentarEstoqueInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const movimentacao = await movimentarEstoque(body, {
      lanchoneteId: session!.user.lanchonete_id,
      usuarioId:    session!.user.id!,
    });
    return NextResponse.json(movimentacao, { status: 201 });
  } catch (err) {
    // Erros de validação e regra de negócio → 400 (entrada do usuário)
    if (err instanceof StockValidationError || err instanceof EstoqueInsuficienteError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // Produto inexistente para o tenant → 404
    if (err instanceof StockNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err; // erro inesperado → 500 (Next.js trata)
  }
}
