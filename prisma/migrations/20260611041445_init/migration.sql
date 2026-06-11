-- CreateEnum
CREATE TYPE "PlanoAssinatura" AS ENUM ('TRIAL', 'BASICO', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'TRIAL', 'INADIMPLENTE', 'CANCELADA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "GatewayPagamento" AS ENUM ('ASAAS', 'MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'CAIXA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'FIADO');

-- CreateEnum
CREATE TYPE "OrigemPedido" AS ENUM ('BALCAO', 'WHATSAPP', 'TELEFONE');

-- CreateEnum
CREATE TYPE "TipoAdicional" AS ENUM ('ADICIONAL', 'EXCECAO');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusWebhook" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PROCESSADO', 'ERRO', 'IGNORADO');

-- CreateEnum
CREATE TYPE "TipoMensagemWhatsApp" AS ENUM ('CONFIRMACAO_PEDIDO', 'PEDIDO_PRONTO', 'PEDIDO_CANCELADO', 'COBRANCA', 'PROMO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StatusMensagemWhatsApp" AS ENUM ('ENVIADO', 'ENTREGUE', 'LIDO', 'FALHOU');

-- CreateTable
CREATE TABLE "lanchonetes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "telefone" VARCHAR(20),
    "cnpj" VARCHAR(18),
    "endereco" TEXT,
    "logo_url" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "lanchonetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "plano" "PlanoAssinatura" NOT NULL DEFAULT 'TRIAL',
    "status" "StatusAssinatura" NOT NULL DEFAULT 'TRIAL',
    "gateway" "GatewayPagamento",
    "gateway_customer_id" TEXT,
    "gateway_subscription_id" TEXT,
    "valor_mensal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "data_inicio" TIMESTAMPTZ(3) NOT NULL,
    "data_vencimento" TIMESTAMPTZ(3),
    "data_cancelamento" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" TEXT,
    "role" "RoleUsuario" NOT NULL DEFAULT 'CAIXA',
    "ultimo_acesso_em" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "endereco" TEXT,
    "total_pedidos" INTEGER NOT NULL DEFAULT 0,
    "total_gasto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "categoria_id" UUID,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "preco_venda" DECIMAL(10,2) NOT NULL,
    "preco_custo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,
    "unidade" VARCHAR(10) NOT NULL DEFAULT 'un',
    "imagem_url" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_adicionais" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "produto_id" UUID,
    "nome" VARCHAR(80) NOT NULL,
    "tipo" "TipoAdicional" NOT NULL DEFAULT 'ADICIONAL',
    "preco_extra" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "produtos_adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "cliente_id" UUID,
    "usuario_id" UUID NOT NULL,
    "numero_pedido" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO',
    "forma_pagamento" "FormaPagamento" NOT NULL DEFAULT 'DINHEIRO',
    "origem" "OrigemPedido" NOT NULL DEFAULT 'BALCAO',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "troco" DECIMAL(10,2),
    "observacao" TEXT,
    "motivo_cancelamento" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "pedido_id" UUID NOT NULL,
    "produto_id" UUID,
    "produto_nome" VARCHAR(120) NOT NULL,
    "produto_preco_unitario" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_adicionais" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "item_pedido_id" UUID NOT NULL,
    "produto_adicional_id" UUID,
    "nome" VARCHAR(80) NOT NULL,
    "tipo" "TipoAdicional" NOT NULL,
    "preco_extra" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_pedido_adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "pedido_id" UUID,
    "usuario_id" UUID NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" VARCHAR(60) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativo_em" TIMESTAMPTZ(3),

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_eventos" (
    "id" UUID NOT NULL,
    "id_externo" VARCHAR(255) NOT NULL,
    "lanchonete_id" UUID,
    "payload" JSONB NOT NULL,
    "status" "StatusWebhook" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro_mensagem" TEXT,
    "recebido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_em" TIMESTAMPTZ(3),

    CONSTRAINT "webhook_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_pedido_seq" (
    "lanchonete_id" UUID NOT NULL,
    "seq" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "_pedido_seq_pkey" PRIMARY KEY ("lanchonete_id")
);

-- CreateTable
CREATE TABLE "mensagens_whatsapp" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "cliente_id" UUID,
    "pedido_id" UUID,
    "numero_destino" VARCHAR(20) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "TipoMensagemWhatsApp" NOT NULL,
    "status" "StatusMensagemWhatsApp" NOT NULL DEFAULT 'ENVIADO',
    "id_mensagem_wpp" VARCHAR(255),
    "enviado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "mensagens_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lanchonetes_slug_key" ON "lanchonetes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lanchonetes_cnpj_key" ON "lanchonetes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_lanchonete_id_key" ON "assinaturas"("lanchonete_id");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_gateway_subscription_id_key" ON "assinaturas"("gateway_subscription_id");

-- CreateIndex
CREATE INDEX "usuarios_lanchonete_id_idx" ON "usuarios"("lanchonete_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_lanchonete_id_email_key" ON "usuarios"("lanchonete_id", "email");

-- CreateIndex
CREATE INDEX "clientes_lanchonete_id_idx" ON "clientes"("lanchonete_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_lanchonete_id_telefone_key" ON "clientes"("lanchonete_id", "telefone");

-- CreateIndex
CREATE INDEX "categorias_lanchonete_id_ordem_idx" ON "categorias"("lanchonete_id", "ordem");

-- CreateIndex
CREATE INDEX "produtos_lanchonete_id_idx" ON "produtos"("lanchonete_id");

-- CreateIndex
CREATE INDEX "produtos_lanchonete_id_categoria_id_idx" ON "produtos"("lanchonete_id", "categoria_id");

-- CreateIndex
CREATE INDEX "produtos_adicionais_lanchonete_id_idx" ON "produtos_adicionais"("lanchonete_id");

-- CreateIndex
CREATE INDEX "produtos_adicionais_lanchonete_id_produto_id_idx" ON "produtos_adicionais"("lanchonete_id", "produto_id");

-- CreateIndex
CREATE INDEX "pedidos_lanchonete_id_status_idx" ON "pedidos"("lanchonete_id", "status");

-- CreateIndex
CREATE INDEX "pedidos_lanchonete_id_criado_em_idx" ON "pedidos"("lanchonete_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "pedidos_lanchonete_id_cliente_id_idx" ON "pedidos"("lanchonete_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_lanchonete_id_numero_pedido_key" ON "pedidos"("lanchonete_id", "numero_pedido");

-- CreateIndex
CREATE INDEX "itens_pedido_lanchonete_id_pedido_id_idx" ON "itens_pedido"("lanchonete_id", "pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_adicionais_lanchonete_id_item_pedido_id_idx" ON "itens_pedido_adicionais"("lanchonete_id", "item_pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_pedido_id_key" ON "transacoes"("pedido_id");

-- CreateIndex
CREATE INDEX "transacoes_lanchonete_id_data_idx" ON "transacoes"("lanchonete_id", "data" DESC);

-- CreateIndex
CREATE INDEX "transacoes_lanchonete_id_tipo_idx" ON "transacoes"("lanchonete_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_eventos_id_externo_key" ON "webhook_eventos"("id_externo");

-- CreateIndex
CREATE INDEX "webhook_eventos_status_recebido_em_idx" ON "webhook_eventos"("status", "recebido_em" ASC);

-- CreateIndex
CREATE INDEX "webhook_eventos_lanchonete_id_idx" ON "webhook_eventos"("lanchonete_id");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_whatsapp_id_mensagem_wpp_key" ON "mensagens_whatsapp"("id_mensagem_wpp");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_lanchonete_id_enviado_em_idx" ON "mensagens_whatsapp"("lanchonete_id", "enviado_em" DESC);

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_lanchonete_id_cliente_id_idx" ON "mensagens_whatsapp"("lanchonete_id", "cliente_id");

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_adicionais" ADD CONSTRAINT "produtos_adicionais_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_adicionais" ADD CONSTRAINT "produtos_adicionais_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_adicionais" ADD CONSTRAINT "itens_pedido_adicionais_item_pedido_id_fkey" FOREIGN KEY ("item_pedido_id") REFERENCES "itens_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_adicionais" ADD CONSTRAINT "itens_pedido_adicionais_produto_adicional_id_fkey" FOREIGN KEY ("produto_adicional_id") REFERENCES "produtos_adicionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_eventos" ADD CONSTRAINT "webhook_eventos_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
