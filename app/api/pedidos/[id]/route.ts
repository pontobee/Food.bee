import { NextRequest, NextResponse } from "next/server";
import { z }    from "zod";
import { auth } from "@/auth";
import { authGuard } from "@/lib/auth-guards";
import { updateOrderStatus } from "@/modules/orders/orders.service";
import { OrderNotFoundError, OrderValidationError } from "@/modules/orders/orders.errors";

const patchSchema = z.object({
  status:              z.enum(["AGUARDANDO", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"]),
  motivo_cancelamento: z.string().max(500).nullish(),
});

// PATCH /api/pedidos/[id] — atualiza status do pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id } = await params;

  try {
    const atualizado = await updateOrderStatus(id, parsed.data, {
      lanchoneteId: session!.user.lanchonete_id,
      usuarioId:    session!.user.id!,
    });
    return NextResponse.json(atualizado);
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
