import { NextRequest, NextResponse }    from "next/server";
import { prisma }                       from "@/lib/prisma";
import { confirmarPagamentoMP }         from "@/modules/pix/pix.service";

// POST /api/webhooks/mercadopago — receptor de eventos do Mercado Pago
// Rota pública. Verifica autenticidade buscando o pagamento via API MP.
export async function POST(req: NextRequest) {
  let body: { action?: string; data?: { id?: string }; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // MP envia tanto "payment.updated" quanto "payment" como type
  const isPaymentEvent =
    body.action === "payment.updated" ||
    body.type   === "payment";

  if (!isPaymentEvent || !body.data?.id) {
    return NextResponse.json({ ok: true }); // evento irrelevante — ignora
  }

  const paymentId = String(body.data.id);

  // Descobre qual tenant tem esse txid e pega o access_token correspondente
  const pedido = await prisma.pedido.findFirst({
    where:   { pix_txid: paymentId, inativo_em: null },
    select:  { lanchonete_id: true },
  });

  if (!pedido) {
    return NextResponse.json({ ok: true }); // pedido não encontrado — ignora
  }

  const config = await prisma.pixConfig.findUnique({
    where:  { lanchonete_id: pedido.lanchonete_id },
    select: { access_token: true },
  });

  if (!config) return NextResponse.json({ ok: true });

  await confirmarPagamentoMP(paymentId, config.access_token);

  return NextResponse.json({ ok: true });
}
