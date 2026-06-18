// Erros de domínio do módulo de equipe (gerenciamento de usuários).
// A camada HTTP traduz cada um para o status apropriado.

/** Entrada inválida — nome/email/senha/role fora do esperado (HTTP 400). */
export class TeamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamValidationError";
  }
}

/**
 * Já existe um usuário ativo com esse e-mail NESTE tenant.
 * Mapeia para HTTP 409 (conflito) — o e-mail é único por lanchonete.
 */
export class EmailEmUsoError extends Error {
  constructor(message = "Já existe um membro com este e-mail nesta lanchonete") {
    super(message);
    this.name = "EmailEmUsoError";
  }
}
