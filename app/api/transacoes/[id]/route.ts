import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lid = session.user.lanchonete_id;

  const transacao = await prisma.transacao.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });

  if (!transacao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  // Bloqueia exclusão de transações vinculadas a pedidos (geradas automaticamente)
  if (transacao.pedido_id) {
    return NextResponse.json(
      { error: "Transações de pedidos não podem ser removidas manualmente" },
      { status: 422 }
    );
  }

  await prisma.transacao.update({
    where: { id },
    data:  { inativo_em: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
