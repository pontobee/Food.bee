import { NextResponse }     from "next/server";
import { auth }             from "@/auth";
import { gerarPixPedido }   from "@/modules/pix/pix.service";

// GET /api/pedidos/[id]/pix — gera ou retorna QR Code Pix do pedido
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const data = await gerarPixPedido(id, session.user.lanchonete_id);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar Pix";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
