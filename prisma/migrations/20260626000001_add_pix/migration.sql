-- AlterTable: campos Pix no Pedido
ALTER TABLE "pedidos"
  ADD COLUMN IF NOT EXISTS "pago_em"    TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "pix_txid"   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "pix_qrcode" TEXT;

-- CreateTable: configuração Pix por tenant
CREATE TABLE IF NOT EXISTS "pix_configs" (
  "id"            UUID           NOT NULL DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID           NOT NULL,
  "gateway"       "GatewayPagamento" NOT NULL DEFAULT 'MERCADO_PAGO',
  "access_token"  TEXT           NOT NULL,
  "criado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pix_configs_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "pix_configs_lanchonete_id_key" UNIQUE ("lanchonete_id"),
  CONSTRAINT "pix_configs_lanchonete_id_fkey"
    FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);
