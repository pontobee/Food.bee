-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TipoEntrega" AS ENUM ('BALCAO', 'DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: zonas de entrega por tenant
CREATE TABLE IF NOT EXISTS "taxas_entrega" (
  "id"            UUID           NOT NULL DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID           NOT NULL,
  "nome"          VARCHAR(80)    NOT NULL,
  "taxa"          DECIMAL(8,2)   NOT NULL,
  "tempo_min"     INT,
  "ativa"         BOOLEAN        NOT NULL DEFAULT TRUE,
  "criado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "taxas_entrega_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "taxas_entrega_lanchonete_id_fkey"
    FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "taxas_entrega_lanchonete_id_ativa_idx"
  ON "taxas_entrega"("lanchonete_id", "ativa");

-- AlterTable: campos de delivery no Pedido
ALTER TABLE "pedidos"
  ADD COLUMN IF NOT EXISTS "tipo_entrega"     "TipoEntrega" NOT NULL DEFAULT 'BALCAO',
  ADD COLUMN IF NOT EXISTS "taxa_entrega_id"  UUID,
  ADD COLUMN IF NOT EXISTS "taxa_entrega"     DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS "endereco_entrega" VARCHAR(255);

DO $$ BEGIN
  ALTER TABLE "pedidos"
    ADD CONSTRAINT "pedidos_taxa_entrega_id_fkey"
      FOREIGN KEY ("taxa_entrega_id") REFERENCES "taxas_entrega"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
