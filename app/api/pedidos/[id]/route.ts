import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateOrderStatus } from "@/modules/orders/orders.service";
import { OrderNotFoundError } from "@/modules/orders/orders.errors";

// PATCH /api/pedidos/[id] — atualiza status do pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const atualizado = await updateOrderStatus(id, body, {
      lanchoneteId: session.user.lanchonete_id,
      usuarioId:    session.user.id!,
    });
    return NextResponse.json(atualizado);
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
