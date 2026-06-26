CREATE TABLE IF NOT EXISTS "sessoes_whatsapp" (
  "id"            UUID           NOT NULL DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID           NOT NULL,
  "telefone"      VARCHAR(20)    NOT NULL,
  "estado"        VARCHAR(30)    NOT NULL,
  "dados"         JSONB          NOT NULL DEFAULT '{}',
  "expira_em"     TIMESTAMPTZ(3) NOT NULL,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessoes_whatsapp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessoes_whatsapp_lanchonete_id_telefone_key" UNIQUE ("lanchonete_id", "telefone"),
  CONSTRAINT "sessoes_whatsapp_lanchonete_id_fkey"
    FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "sessoes_whatsapp_expira_em_idx" ON "sessoes_whatsapp"("expira_em");
