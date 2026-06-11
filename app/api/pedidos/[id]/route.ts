import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/pedidos/[id] — atualiza status do pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lid    = session.user.lanchonete_id;
  const { status, motivo_cancelamento } = await req.json();

  const pedido = await prisma.pedido.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      status,
      motivo_cancelamento: motivo_cancelamento ?? null,
    },
  });

  // Cria transação de receita ao entregar
  if (status === "ENTREGUE" && pedido.status !== "ENTREGUE") {
    await prisma.transacao.create({
      data: {
        lanchonete_id: lid,
        pedido_id:     id,
        usuario_id:    session.user.id!,
        tipo:          "RECEITA",
        categoria:     "Venda",
        descricao:     `Pedido #${pedido.numero_pedido}`,
        valor:         pedido.total,
      },
    });
  }

  return NextResponse.json(atualizado);
}
