import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createCustomer,
  createSubscription,
  getSubscriptionPayments,
  getPixQrCode,
} from "@/lib/asaas";

const PLANOS_VALOR: Record<string, number> = {
  BASICO:     79.90,
  PRO:       179.90,
  ENTERPRISE: 199.90,
};

function amanha(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { plano?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const plano = body.plano?.toUpperCase();
  if (!plano || !(plano in PLANOS_VALOR)) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  if (!process.env.ASAAS_API_KEY) {
    return NextResponse.json(
      { error: "Gateway de pagamento não configurado" },
      { status: 503 },
    );
  }

  const lanchoneteId = session.user.lanchonete_id;

  const lanchonete = await prisma.lanchonete.findUniqueOrThrow({
    where: { id: lanchoneteId },
    select: { nome: true, cnpj: true, assinatura: true },
  });

  const assinatura = lanchonete.assinatura;
  if (!assinatura) {
    return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
  }

  // Cria ou reutiliza customer no Asaas
  let customerId = assinatura.gateway_customer_id;
  if (!customerId) {
    const customer = await createCustomer({
      name:     lanchonete.nome,
      email:    session.user.email!,
      ...(lanchonete.cnpj && { cpfCnpj: lanchonete.cnpj }),
    });
    customerId = customer.id;
  }

  // Cria ou reutiliza subscription no Asaas
  let subscriptionId = assinatura.gateway_subscription_id;
  if (!subscriptionId || assinatura.plano !== plano) {
    const nomePlano = plano.charAt(0) + plano.slice(1).toLowerCase();
    const sub = await createSubscription({
      customer:    customerId,
      billingType: "PIX",
      value:       PLANOS_VALOR[plano],
      nextDueDate: amanha(),
      cycle:       "MONTHLY",
      description: `Plano ${nomePlano} - LancheSmart`,
    });
    subscriptionId = sub.id;
  }

  // Obtém primeira cobrança pendente
  const { data: pagamentos } = await getSubscriptionPayments(subscriptionId);
  if (!pagamentos.length) {
    return NextResponse.json(
      { error: "Nenhuma cobrança pendente encontrada" },
      { status: 500 },
    );
  }

  const pix = await getPixQrCode(pagamentos[0].id);

  // Persiste IDs do gateway
  await prisma.assinatura.update({
    where: { lanchonete_id: lanchoneteId },
    data: {
      plano:                   plano as never,
      gateway:                 "ASAAS",
      gateway_customer_id:     customerId,
      gateway_subscription_id: subscriptionId,
      valor_mensal:            PLANOS_VALOR[plano],
    },
  });

  return NextResponse.json({
    pix_qrcode_image: pix.encodedImage,
    pix_payload:      pix.payload,
    valor:            PLANOS_VALOR[plano],
    vencimento:       pix.expirationDate,
  });
}
