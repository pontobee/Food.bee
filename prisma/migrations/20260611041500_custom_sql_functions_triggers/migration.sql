-- =============================================================================
-- Migration — Funções, Triggers e Sequence customizadas (SQL puro)
-- Não representáveis no schema.prisma — necessárias para:
--   * numero_pedido sequencial por tenant (next_numero_pedido)
--   * updated_at automático (assinaturas, pedidos, mensagens_whatsapp)
--   * agregados de CRM (clientes.total_pedidos / total_gasto)
--   * baixa automática de estoque ao ENTREGAR pedido
--   * LISTEN/NOTIFY para realtime via SSE (Kanban)
-- =============================================================================

-- ─── SEQUENCE DE NÚMERO DE PEDIDO POR TENANT ─────────────────────────────────
-- Função que garante numero_pedido sequencial e isolado por lanchonete.
-- Usa a tabela "_pedido_seq" (modelada em schema.prisma) para evitar gaps por
-- rollback de transaction.

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
