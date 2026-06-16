// Erros de domínio do módulo de estoque.
// A camada HTTP (route handlers) traduz cada um para o status apropriado.
// Mesma estratégia usada em modules/orders/orders.errors.ts.

/** Entrada inválida do cliente — ex.: quantidade <= 0 (mapeia para HTTP 400). */
export class StockValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockValidationError";
  }
}

/** Produto inexistente para o tenant autenticado (mapeia para HTTP 404). */
export class StockNotFoundError extends Error {
  constructor(message = "Produto não encontrado") {
    super(message);
    this.name = "StockNotFoundError";
  }
}

/**
 * Saída maior que o saldo disponível — o estoque não pode ficar negativo.
 * É uma regra de negócio (e não um erro do sistema), por isso também 400.
 */
export class EstoqueInsuficienteError extends Error {
  constructor(message = "Estoque insuficiente para esta saída") {
    super(message);
    this.name = "EstoqueInsuficienteError";
  }
}
