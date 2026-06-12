// Erros de domínio do módulo de pedidos.
// A camada HTTP (route handlers) mapeia cada um para o status apropriado.

/** Entrada inválida do cliente (mapeia para HTTP 400). */
export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

/** Pedido inexistente para o tenant autenticado (mapeia para HTTP 404). */
export class OrderNotFoundError extends Error {
  constructor(message = "Pedido não encontrado") {
    super(message);
    this.name = "OrderNotFoundError";
  }
}
