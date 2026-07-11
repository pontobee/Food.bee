import { NextRequest, NextResponse }       from "next/server";
import { createPublicOrder, CriarPedidoPublicoInput } from "@/modules/public/public.service";
import { OrderValidationError }            from "@/modules/orders/orders.errors";

// POST /api/public/[slug]/pedidos — público, sem autenticação
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: CriarPedidoPublicoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const pedido = await createPublicOrder(slug, body);
    return NextResponse.json(pedido, { status: 201 });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
