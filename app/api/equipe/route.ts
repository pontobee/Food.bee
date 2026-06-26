import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { adminGuard } from "@/lib/auth-guards";
import {
  listarMembros,
  convidarMembro,
  type ConvidarMembroInput,
} from "@/modules/team/team.service";
import { TeamValidationError, EmailEmUsoError } from "@/modules/team/team.errors";

// GET /api/equipe — lista os membros da lanchonete (somente ADMIN).
export async function GET() {
  const session = await auth();
  const guard = adminGuard(session);
  if (guard) return guard;

  const membros = await listarMembros(session!.user.lanchonete_id);
  return NextResponse.json(membros);
}

// POST /api/equipe — convida/cria um novo membro (somente ADMIN).
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard = adminGuard(session);
  if (guard) return guard;

  let body: ConvidarMembroInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    // O novo membro sempre nasce na MESMA lanchonete do admin logado.
    // O lanchonete_id vem da sessão, nunca do body — assim um admin não
    // consegue criar usuários em outro tenant.
    const membro = await convidarMembro(body, session!.user.lanchonete_id);
    return NextResponse.json(membro, { status: 201 });
  } catch (err) {
    if (err instanceof TeamValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof EmailEmUsoError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
