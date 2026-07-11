import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/configuracoes/lanchonete — retorna dados públicos da lanchonete
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lanchonete = await prisma.lanchonete.findUnique({
    where:  { id: session.user.lanchonete_id },
    select: { nome: true, cnpj: true, telefone: true, endereco: true, horarios: true },
  });

  return NextResponse.json(lanchonete ?? {});
}

// PATCH /api/configuracoes/lanchonete — atualiza dados da lanchonete (somente ADMIN)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    nome?:     string;
    cnpj?:     string | null;
    telefone?: string | null;
    endereco?: string | null;
    horarios?: unknown;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if (body.nome     !== undefined) data.nome     = body.nome?.trim() || undefined;
  if (body.cnpj     !== undefined) data.cnpj     = body.cnpj?.trim()     || null;
  if (body.telefone !== undefined) data.telefone = body.telefone?.trim() || null;
  if (body.endereco !== undefined) data.endereco = body.endereco?.trim() || null;
  if (body.horarios !== undefined) data.horarios = body.horarios;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const atualizada = await prisma.lanchonete.update({
    where:  { id: session.user.lanchonete_id },
    data,
    select: { nome: true, cnpj: true, telefone: true, endereco: true, horarios: true },
  });

  return NextResponse.json(atualizada);
}
