import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/equipe/[id] — altera role do membro (somente ADMIN)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body: { role?: string } = await req.json().catch(() => ({}));

  if (!body.role || !["ADMIN", "CAIXA"].includes(body.role)) {
    return NextResponse.json({ error: "Role inválida" }, { status: 400 });
  }

  const membro = await prisma.usuario.findFirst({
    where: { id, lanchonete_id: session.user.lanchonete_id, inativo_em: null },
  });
  if (!membro) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });

  const atualizado = await prisma.usuario.update({
    where:  { id },
    data:   { role: body.role as "ADMIN" | "CAIXA" },
    select: { id: true, nome: true, email: true, role: true, ultimo_acesso_em: true, criado_em: true },
  });

  return NextResponse.json(atualizado);
}

// DELETE /api/equipe/[id] — soft delete do membro (somente ADMIN)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Impede que o admin se remova da própria equipe
  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode remover sua própria conta" }, { status: 400 });
  }

  const membro = await prisma.usuario.findFirst({
    where: { id, lanchonete_id: session.user.lanchonete_id, inativo_em: null },
  });
  if (!membro) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });

  await prisma.usuario.update({
    where: { id },
    data:  { inativo_em: new Date() },
  });

  return NextResponse.json({ ok: true });
}
