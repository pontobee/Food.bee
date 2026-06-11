-- =============================================================================
-- Migration 0001 — LancheSmart Init
-- Inclui: schema completo + triggers + sequences + LISTEN/NOTIFY
-- =============================================================================

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE "PlanoAssinatura"    AS ENUM ('TRIAL', 'BASICO', 'PRO', 'ENTERPRISE');
CREATE TYPE "StatusAssinatura"   AS ENUM ('ATIVA', 'TRIAL', 'INADIMPLENTE', 'CANCELADA', 'SUSPENSA');
CREATE TYPE "GatewayPagamento"   AS ENUM ('ASAAS', 'MERCADO_PAGO');
CREATE TYPE "RoleUsuario"        AS ENUM ('ADMIN', 'CAIXA');
CREATE TYPE "StatusPedido"       AS ENUM ('AGUARDANDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO');
CREATE TYPE "FormaPagamento"     AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'FIADO');
CREATE TYPE "OrigemPedido"       AS ENUM ('BALCAO', 'WHATSAPP', 'TELEFONE');
CREATE TYPE "TipoAdicional"      AS ENUM ('ADICIONAL', 'EXCECAO');
CREATE TYPE "TipoTransacao"      AS ENUM ('RECEITA', 'DESPESA');
CREATE TYPE "StatusWebhook"      AS ENUM ('PENDENTE', 'PROCESSANDO', 'PROCESSADO', 'ERRO', 'IGNORADO');
CREATE TYPE "TipoMensagemWhatsApp"   AS ENUM ('CONFIRMACAO_PEDIDO', 'PEDIDO_PRONTO', 'PEDIDO_CANCELADO', 'COBRANCA', 'PROMO', 'CUSTOM');
CREATE TYPE "StatusMensagemWhatsApp" AS ENUM ('ENVIADO', 'ENTREGUE', 'LIDO', 'FALHOU');

-- ─── TABELAS ─────────────────────────────────────────────────────────────────

CREATE TABLE "lanchonetes" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"       VARCHAR(120) NOT NULL,
  "slug"       VARCHAR(60)  NOT NULL UNIQUE,
  "telefone"   VARCHAR(20),
  "cnpj"       VARCHAR(18)  UNIQUE,
  "endereco"   TEXT,
  "logo_url"   TEXT,
  "criado_em"  TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em" TIMESTAMPTZ(3)
);

CREATE TABLE "assinaturas" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"           UUID NOT NULL UNIQUE REFERENCES "lanchonetes"("id"),
  "plano"                   "PlanoAssinatura"  NOT NULL DEFAULT 'TRIAL',
  "status"                  "StatusAssinatura" NOT NULL DEFAULT 'TRIAL',
  "gateway"                 "GatewayPagamento",
  "gateway_customer_id"     TEXT,
  "gateway_subscription_id" TEXT UNIQUE,
  "valor_mensal"            DECIMAL(10,2) NOT NULL DEFAULT 0,
  "data_inicio"             TIMESTAMPTZ(3) NOT NULL,
  "data_vencimento"         TIMESTAMPTZ(3),
  "data_cancelamento"       TIMESTAMPTZ(3),
  "criado_em"               TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "atualizado_em"           TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "usuarios" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"    UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "nome"             VARCHAR(100)  NOT NULL,
  "email"            VARCHAR(255)  NOT NULL,
  "senha_hash"       TEXT,
  "role"             "RoleUsuario" NOT NULL DEFAULT 'CAIXA',
  "ultimo_acesso_em" TIMESTAMPTZ(3),
  "criado_em"        TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"       TIMESTAMPTZ(3),
  UNIQUE ("lanchonete_id", "email")
);

CREATE TABLE "clientes" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"  UUID         NOT NULL REFERENCES "lanchonetes"("id"),
  "nome"           VARCHAR(120) NOT NULL,
  "telefone"       VARCHAR(20)  NOT NULL,
  "endereco"       TEXT,
  "total_pedidos"  INT          NOT NULL DEFAULT 0,
  "total_gasto"    DECIMAL(12,2) NOT NULL DEFAULT 0,
  "criado_em"      TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"     TIMESTAMPTZ(3),
  UNIQUE ("lanchonete_id", "telefone")
);

CREATE TABLE "categorias" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID         NOT NULL REFERENCES "lanchonetes"("id"),
  "nome"          VARCHAR(80)  NOT NULL,
  "descricao"     TEXT,
  "ordem"         INT          NOT NULL DEFAULT 0,
  "criado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"    TIMESTAMPTZ(3)
);

CREATE TABLE "produtos" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"  UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "categoria_id"   UUID REFERENCES "categorias"("id"),
  "nome"           VARCHAR(120)  NOT NULL,
  "descricao"      TEXT,
  "preco_venda"    DECIMAL(10,2) NOT NULL,
  "preco_custo"    DECIMAL(10,2) NOT NULL DEFAULT 0,
  "estoque_atual"  INT           NOT NULL DEFAULT 0,
  "estoque_minimo" INT           NOT NULL DEFAULT 0,
  "unidade"        VARCHAR(10)   NOT NULL DEFAULT 'un',
  "imagem_url"     TEXT,
  "criado_em"      TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"     TIMESTAMPTZ(3)
);

CREATE TABLE "produtos_adicionais" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "produto_id"    UUID REFERENCES "produtos"("id"),
  "nome"          VARCHAR(80)    NOT NULL,
  "tipo"          "TipoAdicional" NOT NULL DEFAULT 'ADICIONAL',
  "preco_extra"   DECIMAL(8,2)   NOT NULL DEFAULT 0,
  "criado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"    TIMESTAMPTZ(3)
);

CREATE TABLE "pedidos" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"       UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "cliente_id"          UUID REFERENCES "clientes"("id"),
  "usuario_id"          UUID NOT NULL REFERENCES "usuarios"("id"),
  "numero_pedido"       INT  NOT NULL,
  "status"              "StatusPedido"   NOT NULL DEFAULT 'AGUARDANDO',
  "forma_pagamento"     "FormaPagamento" NOT NULL DEFAULT 'DINHEIRO',
  "origem"              "OrigemPedido"   NOT NULL DEFAULT 'BALCAO',
  "subtotal"            DECIMAL(10,2) NOT NULL,
  "desconto"            DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total"               DECIMAL(10,2) NOT NULL,
  "troco"               DECIMAL(10,2),
  "observacao"          TEXT,
  "motivo_cancelamento" TEXT,
  "criado_em"           TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "atualizado_em"       TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"          TIMESTAMPTZ(3),
  UNIQUE ("lanchonete_id", "numero_pedido")
);

CREATE TABLE "itens_pedido" (
  "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"          UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "pedido_id"              UUID NOT NULL REFERENCES "pedidos"("id"),
  "produto_id"             UUID REFERENCES "produtos"("id"),
  "produto_nome"           VARCHAR(120)  NOT NULL,
  "produto_preco_unitario" DECIMAL(10,2) NOT NULL,
  "quantidade"             INT           NOT NULL DEFAULT 1,
  "total"                  DECIMAL(10,2) NOT NULL
);

CREATE TABLE "itens_pedido_adicionais" (
  "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"        UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "item_pedido_id"       UUID NOT NULL REFERENCES "itens_pedido"("id"),
  "produto_adicional_id" UUID REFERENCES "produtos_adicionais"("id"),
  "nome"                 VARCHAR(80)     NOT NULL,
  "tipo"                 "TipoAdicional" NOT NULL,
  "preco_extra"          DECIMAL(8,2)    NOT NULL DEFAULT 0
);

CREATE TABLE "transacoes" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id" UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "pedido_id"     UUID UNIQUE REFERENCES "pedidos"("id"),
  "usuario_id"    UUID NOT NULL REFERENCES "usuarios"("id"),
  "tipo"          "TipoTransacao" NOT NULL,
  "categoria"     VARCHAR(60) NOT NULL,
  "descricao"     TEXT        NOT NULL,
  "valor"         DECIMAL(12,2) NOT NULL,
  "data"          TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "criado_em"     TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "inativo_em"    TIMESTAMPTZ(3)
);

CREATE TABLE "webhook_eventos" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "id_externo"    VARCHAR(255) NOT NULL UNIQUE,
  "lanchonete_id" UUID REFERENCES "lanchonetes"("id"),
  "payload"       JSONB        NOT NULL,
  "status"        "StatusWebhook" NOT NULL DEFAULT 'PENDENTE',
  "tentativas"    INT          NOT NULL DEFAULT 0,
  "erro_mensagem" TEXT,
  "recebido_em"   TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "processado_em" TIMESTAMPTZ(3)
);

CREATE TABLE "mensagens_whatsapp" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lanchonete_id"    UUID NOT NULL REFERENCES "lanchonetes"("id"),
  "cliente_id"       UUID REFERENCES "clientes"("id"),
  "pedido_id"        UUID REFERENCES "pedidos"("id"),
  "numero_destino"   VARCHAR(20) NOT NULL,
  "mensagem"         TEXT        NOT NULL,
  "tipo"             "TipoMensagemWhatsApp"   NOT NULL,
  "status"           "StatusMensagemWhatsApp" NOT NULL DEFAULT 'ENVIADO',
  "id_mensagem_wpp"  VARCHAR(255) UNIQUE,
  "enviado_em"       TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "atualizado_em"    TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- ─── ÍNDICES DE PERFORMANCE ──────────────────────────────────────────────────

CREATE INDEX idx_usuarios_lanchonete         ON "usuarios"              ("lanchonete_id");
CREATE INDEX idx_clientes_lanchonete         ON "clientes"              ("lanchonete_id");
CREATE INDEX idx_categorias_lanchonete_ordem ON "categorias"            ("lanchonete_id", "ordem");
CREATE INDEX idx_produtos_lanchonete         ON "produtos"              ("lanchonete_id");
CREATE INDEX idx_produtos_categoria          ON "produtos"              ("lanchonete_id", "categoria_id");
CREATE INDEX idx_adicionais_lanchonete       ON "produtos_adicionais"   ("lanchonete_id");
CREATE INDEX idx_adicionais_produto          ON "produtos_adicionais"   ("lanchonete_id", "produto_id");
CREATE INDEX idx_pedidos_status              ON "pedidos"               ("lanchonete_id", "status");
CREATE INDEX idx_pedidos_criado              ON "pedidos"               ("lanchonete_id", "criado_em" DESC);
CREATE INDEX idx_pedidos_cliente             ON "pedidos"               ("lanchonete_id", "cliente_id");
CREATE INDEX idx_itens_pedido                ON "itens_pedido"          ("lanchonete_id", "pedido_id");
CREATE INDEX idx_itens_adicionais            ON "itens_pedido_adicionais" ("lanchonete_id", "item_pedido_id");
CREATE INDEX idx_transacoes_data             ON "transacoes"            ("lanchonete_id", "data" DESC);
CREATE INDEX idx_transacoes_tipo             ON "transacoes"            ("lanchonete_id", "tipo");
CREATE INDEX idx_webhook_fila                ON "webhook_eventos"       ("status", "recebido_em" ASC);
CREATE INDEX idx_webhook_lanchonete          ON "webhook_eventos"       ("lanchonete_id");
CREATE INDEX idx_mensagens_lanchonete        ON "mensagens_whatsapp"    ("lanchonete_id", "enviado_em" DESC);
CREATE INDEX idx_mensagens_cliente           ON "mensagens_whatsapp"    ("lanchonete_id", "cliente_id");

-- ─── SEQUENCE DE NÚMERO DE PEDIDO POR TENANT ─────────────────────────────────
-- Função que garante numero_pedido sequencial e isolado por lanchonete.
-- Usa uma tabela de contadores para evitar gaps por rollback de transaction.

CREATE TABLE "_pedido_seq" (
  "lanchonete_id" UUID PRIMARY KEY,
  "seq"           BIGINT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_numero_pedido(p_lanchonete_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  INSERT INTO "_pedido_seq" ("lanchonete_id", "seq")
  VALUES (p_lanchonete_id, 1)
  ON CONFLICT ("lanchonete_id") DO UPDATE
    SET "seq" = "_pedido_seq"."seq" + 1
  RETURNING "seq" INTO v_seq;
  RETURN v_seq::INT;
END;
$$;

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────

-- updated_at automático para pedidos e assinaturas
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."atualizado_em" = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedidos_updated_at
  BEFORE UPDATE ON "pedidos"
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_assinaturas_updated_at
  BEFORE UPDATE ON "assinaturas"
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_mensagens_updated_at
  BEFORE UPDATE ON "mensagens_whatsapp"
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Atualiza agregados do cliente ao ENTREGAR pedido
CREATE OR REPLACE FUNCTION fn_atualiza_agregados_cliente()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'ENTREGUE' AND OLD."status" != 'ENTREGUE' AND NEW."cliente_id" IS NOT NULL THEN
    UPDATE "clientes"
    SET
      "total_pedidos" = "total_pedidos" + 1,
      "total_gasto"   = "total_gasto"   + NEW."total"
    WHERE "id" = NEW."cliente_id";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_entregue_cliente
  AFTER UPDATE ON "pedidos"
  FOR EACH ROW EXECUTE FUNCTION fn_atualiza_agregados_cliente();

-- Decrementa estoque ao ENTREGAR (via itens do pedido)
CREATE OR REPLACE FUNCTION fn_decrementa_estoque()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'ENTREGUE' AND OLD."status" != 'ENTREGUE' THEN
    UPDATE "produtos" p
    SET "estoque_atual" = p."estoque_atual" - ip."quantidade"
    FROM "itens_pedido" ip
    WHERE ip."pedido_id" = NEW."id"
      AND ip."produto_id" = p."id"
      AND p."lanchonete_id" = NEW."lanchonete_id";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_entregue_estoque
  AFTER UPDATE ON "pedidos"
  FOR EACH ROW EXECUTE FUNCTION fn_decrementa_estoque();

-- ─── LISTEN/NOTIFY — canal de realtime via SSE ───────────────────────────────
-- Dispara notificação ao mudar status do pedido.
-- O Next.js Route Handler em /api/events/[lanchonete_id] faz LISTEN neste canal
-- e retransmite via SSE para o Kanban do dashboard.

CREATE OR REPLACE FUNCTION fn_notify_pedido_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    PERFORM pg_notify(
      'pedido_status_' || NEW."lanchonete_id"::TEXT,
      json_build_object(
        'id',        NEW."id",
        'numero',    NEW."numero_pedido",
        'status',    NEW."status",
        'total',     NEW."total",
        'criado_em', NEW."criado_em"
      )::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_pedido_status
  AFTER UPDATE ON "pedidos"
  FOR EACH ROW EXECUTE FUNCTION fn_notify_pedido_status();

-- Notifica também na inserção (pedido novo entrando no Kanban)
CREATE OR REPLACE FUNCTION fn_notify_pedido_novo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'pedido_status_' || NEW."lanchonete_id"::TEXT,
    json_build_object(
      'id',        NEW."id",
      'numero',    NEW."numero_pedido",
      'status',    NEW."status",
      'total',     NEW."total",
      'criado_em', NEW."criado_em"
    )::TEXT
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_pedido_novo
  AFTER INSERT ON "pedidos"
  FOR EACH ROW EXECUTE FUNCTION fn_notify_pedido_novo();
