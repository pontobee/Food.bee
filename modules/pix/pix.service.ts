import { prisma } from "@/lib/prisma";

const MP_API = "https://api.mercadopago.com";

// ── Geração de cobrança Pix via Mercado Pago ──────────────────
// Retorna o payload EMV (copia-e-cola) e salva no pedido.
// Idempotente: se o pedido já tem um pix_txid ativo, reusa.
export async function gerarPixPedido(pedidoId: string, lanchoneteId: string) {
  const pedido = await prisma.pedido.findFirst({
    where:  { id: pedidoId, lanchonete_id: lanchoneteId, inativo_em: null },
    select: {
      id: true, numero_pedido: true, total: true,
      forma_pagamento: true, pix_txid: true, pix_qrcode: true, pago_em: true,
    },
  });
  if (!pedido)             throw new Error("Pedido não encontrado");
  if (pedido.pago_em)     return { pago: true, pix_qrcode: pedido.pix_qrcode };
  if (pedido.pix_qrcode)  return { pago: false, pix_qrcode: pedido.pix_qrcode };

  const config = await prisma.pixConfig.findUnique({
    where:  { lanchonete_id: lanchoneteId },
    select: { access_token: true },
  });
  if (!config) throw new Error("Pix não configurado para esta lanchonete");

  const res = await fetch(`${MP_API}/v1/payments`, {
    method:  "POST",
    headers: {
      Authorization:      `Bearer ${config.access_token}`,
      "Content-Type":     "application/json",
      "X-Idempotency-Key": pedidoId,
    },
    body: JSON.stringify({
      transaction_amount: Number(pedido.total),
      payment_method_id:  "pix",
      description:        `Pedido #${pedido.numero_pedido}`,
      payer:              { email: "pagante@lanchesmart.app" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago: ${err}`);
  }

  const json = await res.json();
  const txid  = String(json.id);
  const emv   = json.point_of_interaction?.transaction_data?.qr_code as string | undefined;

  if (!emv) throw new Error("QR Code não retornado pelo Mercado Pago");

  await prisma.pedido.update({
    where: { id: pedidoId },
    data:  { pix_txid: txid, pix_qrcode: emv },
  });

  return { pago: false, pix_qrcode: emv };
}

// ── Confirmação de pagamento via webhook MP ───────────────────
// Chamado ao receber o webhook de payment.updated aprovado.
export async function confirmarPagamentoMP(paymentId: string, accessToken: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return false;

  const json = await res.json();
  if (json.status !== "approved") return false;

  const pedido = await prisma.pedido.findFirst({
    where:  { pix_txid: String(json.id), inativo_em: null },
    select: { id: true, lanchonete_id: true },
  });
  if (!pedido) return false;

  await prisma.pedido.update({
    where: { id: pedido.id },
    data:  { pago_em: new Date() },
  });

  return true;
}

// ── CRUD de configuração Pix ──────────────────────────────────
export async function getPixConfig(lanchoneteId: string) {
  const config = await prisma.pixConfig.findUnique({
    where:  { lanchonete_id: lanchoneteId },
    select: { gateway: true, access_token: true },
  });
  if (!config) return null;
  // Ofusca o token: exibe apenas os últimos 6 chars
  return {
    gateway:           config.gateway,
    access_token_hint: "…" + config.access_token.slice(-6),
    configurado:       true,
  };
}

export async function salvarPixConfig(lanchoneteId: string, accessToken: string) {
  return prisma.pixConfig.upsert({
    where:  { lanchonete_id: lanchoneteId },
    update: { access_token: accessToken, atualizado_em: new Date() },
    create: { lanchonete_id: lanchoneteId, access_token: accessToken, gateway: "MERCADO_PAGO" },
  });
}
