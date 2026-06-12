import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTodaysOrders, createOrder, type CriarPedidoInput } from "@/modules/orders/orders.service";
import { OrderValidationError } from "@/modules/orders/orders.errors";

// GET /api/pedidos — retorna pedidos do dia do tenant autenticado
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pedidos = await getTodaysOrders(session.user.lanchonete_id);
  return NextResponse.json(pedidos);
}

// POST /api/pedidos — abre novo pedido
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CriarPedidoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const pedido = await createOrder(body, {
      lanchoneteId: session.user.lanchonete_id,
      usuarioId:    session.user.id!,
    });
    return NextResponse.json(pedido, { status: 201 });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
