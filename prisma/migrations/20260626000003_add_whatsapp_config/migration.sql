-- CreateTable: configuração da Evolution API por tenant
CREATE TABLE IF NOT EXISTS "whatsapp_configs" (
  "id"                UUID           NOT NULL DEFAULT gen_random_uuid(),
  "lanchonete_id"     UUID           NOT NULL,
  "evolution_url"     VARCHAR(255)   NOT NULL,
  "evolution_api_key" TEXT           NOT NULL,
  "instance_nome"     VARCHAR(100)   NOT NULL,
  "criado_em"         TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_configs_lanchonete_id_key" UNIQUE ("lanchonete_id"),
  CONSTRAINT "whatsapp_configs_lanchonete_id_fkey"
    FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);
