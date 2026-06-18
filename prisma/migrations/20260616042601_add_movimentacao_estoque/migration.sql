-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "lanchonete_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "estoque_antes" INTEGER NOT NULL,
    "estoque_depois" INTEGER NOT NULL,
    "motivo" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_lanchonete_id_produto_id_idx" ON "movimentacoes_estoque"("lanchonete_id", "produto_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_lanchonete_id_criado_em_idx" ON "movimentacoes_estoque"("lanchonete_id", "criado_em" DESC);

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_lanchonete_id_fkey" FOREIGN KEY ("lanchonete_id") REFERENCES "lanchonetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
