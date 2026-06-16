import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RoleUsuario } from "@prisma/client";
import { TeamValidationError, EmailEmUsoError } from "@/modules/team/team.errors";

const ROLES = new Set<string>(Object.values(RoleUsuario));
// Regex simples só para barrar erros grosseiros de digitação (a@b.c).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN = 6;

// ── Tipo de entrada (DTO vindo da API) ─────────────────────────
export interface ConvidarMembroInput {
  nome?: string;
  email?: string;
  senha?: string;
  role?: string; // "ADMIN" | "CAIXA"
}

// ── Leitura: membros ativos do tenant ──────────────────────────
// Nunca devolvemos senha_hash para o frontend — selecionamos só o necessário.
export function listarMembros(lanchoneteId: string) {
  return prisma.usuario.findMany({
    where: { lanchonete_id: lanchoneteId, inativo_em: null },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ultimo_acesso_em: true,
      criado_em: true,
    },
    orderBy: [{ role: "asc" }, { nome: "asc" }],
  });
}

// ── Escrita: convida / cria um novo membro ─────────────────────
// A permissão de ADMIN é checada na rota (camada HTTP). Aqui garantimos
// integridade dos dados: validação, e-mail único por tenant e hash da senha.
export async function convidarMembro(input: ConvidarMembroInput, lanchoneteId: string) {
  // 1. Normalização + validação
  const nome  = input.nome?.trim();
  const email = input.email?.trim().toLowerCase();
  const senha = input.senha;
  const role  = input.role;

  if (!nome || nome.length < 2) {
    throw new TeamValidationError("Nome inválido");
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new TeamValidationError("E-mail inválido");
  }
  if (!senha || senha.length < SENHA_MIN) {
    throw new TeamValidationError(`A senha precisa ter ao menos ${SENHA_MIN} caracteres`);
  }
  if (!role || !ROLES.has(role)) {
    throw new TeamValidationError("Nível de acesso inválido (use ADMIN ou CAIXA)");
  }

  // 2. E-mail único por tenant (mesmo e-mail pode existir em OUTRA lanchonete).
  // Checamos a constraint @@unique([lanchonete_id, email]) antes de inserir
  // para devolver uma mensagem amigável em vez de um erro cru do banco.
  const existente = await prisma.usuario.findUnique({
    where: { lanchonete_id_email: { lanchonete_id: lanchoneteId, email } },
    select: { id: true },
  });
  if (existente) throw new EmailEmUsoError();

  // 3. Hash da senha (nunca guardamos a senha em texto puro) — fator 10,
  // mesmo padrão do seed (prisma/seed.ts).
  const senha_hash = await bcrypt.hash(senha, 10);

  // 4. Cria o usuário. Retornamos só campos públicos (sem senha_hash).
  return prisma.usuario.create({
    data: {
      lanchonete_id: lanchoneteId,
      nome,
      email,
      senha_hash,
      role: role as RoleUsuario,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ultimo_acesso_em: true,
      criado_em: true,
    },
  });
}
