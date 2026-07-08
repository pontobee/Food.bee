import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AsaasWebhook = {
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    status: string;
    value: number;
    dueDate: string;
  };
  subscription?: {
    id: string;
  };
};

export async function POST(req: NextRequest) {
  let body: AsaasWebhook;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const subscriptionId = body.payment?.subscription ?? body.subscription?.id;
  if (!subscriptionId) return NextResponse.json({ ok: true });

  const assinatura = await prisma.assinatura.findFirst({
    where: { gateway_subscription_id: subscriptionId },
  });
  if (!assinatura) return NextResponse.json({ ok: true });

  switch (body.event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED": {
      // Próximo vencimento = data da cobrança + 30 dias
      const dueDate = body.payment?.dueDate ? new Date(body.payment.dueDate) : new Date();
      const data_vencimento = new Date(dueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data:  { status: "ATIVA", data_vencimento },
      });
      break;
    }
    case "PAYMENT_OVERDUE":
      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data:  { status: "INADIMPLENTE" },
      });
      break;

    case "SUBSCRIPTION_INACTIVATED":
      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data:  { status: "CANCELADA", data_cancelamento: new Date() },
      });
      break;
  }

  return NextResponse.json({ ok: true });
}
