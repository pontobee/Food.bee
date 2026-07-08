/**
 * Testes de isolamento de tenant.
 *
 * Garantem que nenhuma operação de serviço vaza dados entre lanchonetes:
 *   - lanchonete_id SEMPRE vem do contexto da sessão (JWT), nunca do body
 *   - queries de leitura e escrita sempre filtram pelo tenant correto
 *   - um tenant não consegue operar sobre recursos de outro tenant
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

// TipoMovimentacaoEstoque não está no client gerado enquanto a migration
// add_movimentacao_estoque não for aplicada e `prisma generate` rodado.
// O mock abaixo supre o valor esperado apenas no contexto dos testes.
vi.mock("@prisma/client", async (importOriginal) => {
  const real = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...real,
    TipoMovimentacaoEstoque: { ENTRADA: "ENTRADA", SAIDA: "SAIDA" },
  };
});

// ── Mock do módulo Prisma ──────────────────────────────────────
// Intercepta todas as chamadas ao banco para inspecionar os argumentos.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
    },
    produto:          { findMany: vi.fn() },
    produtoAdicional: { findMany: vi.fn() },
    transacao:        { create:   vi.fn() },
    usuario: {
      findMany:  vi.fn(),
      findUnique: vi.fn(),
      create:    vi.fn(),
    },
    movimentacaoEstoque: { findMany: vi.fn() },
    $queryRaw:     vi.fn(),
    $transaction:  vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { getTodaysOrders, createOrder, updateOrderStatus } from "@/modules/orders/orders.service";
import { listarMembros, convidarMembro } from "@/modules/team/team.service";
import { movimentarEstoque, getMovimentacoes } from "@/modules/stock/stock.service";
import { OrderValidationError, OrderNotFoundError } from "@/modules/orders/orders.errors";
import { StockNotFoundError, StockValidationError } from "@/modules/stock/stock.errors";

const TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const USER_A   = "11111111-1111-1111-1111-111111111111";

// ── Helpers ───────────────────────────────────────────────────
function mockPedido(lanchoneteId: string) {
  return {
    id:             "pedido-1",
    lanchonete_id:  lanchoneteId,
    numero_pedido:  1,
    status:         "PENDENTE",
    total:          { toNumber: () => 50 },
    inativo_em:     null,
  };
}

// ─────────────────────────────────────────────────────────────
describe("Pedidos — isolamento de tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getTodaysOrders sempre filtra pelo lanchonete_id da sessão", async () => {
    vi.mocked(prisma.pedido.findMany).mockResolvedValue([]);

    await getTodaysOrders(TENANT_A);

    const call = vi.mocked(prisma.pedido.findMany).mock.calls[0][0];
    expect(call?.where?.lanchonete_id).toBe(TENANT_A);
  });

  it("updateOrderStatus rejeita pedido de outro tenant", async () => {
    // Pedido pertence ao tenant B; contexto é do tenant A
    vi.mocked(prisma.pedido.findFirst).mockResolvedValue(null);

    await expect(
      updateOrderStatus(
        "pedido-de-tenant-b",
        { status: "EM_PREPARO" },
        { lanchoneteId: TENANT_A, usuarioId: USER_A }
      )
    ).rejects.toThrow(OrderNotFoundError);

    // Garante que o findFirst usou o lanchonete_id do contexto (TENANT_A)
    const call = vi.mocked(prisma.pedido.findFirst).mock.calls[0][0];
    expect(call?.where?.lanchonete_id).toBe(TENANT_A);
  });

  it("updateOrderStatus não executa update quando pedido não pertence ao tenant", async () => {
    vi.mocked(prisma.pedido.findFirst).mockResolvedValue(null);

    await expect(
      updateOrderStatus(
        "pedido-alheio",
        { status: "PRONTO" },
        { lanchoneteId: TENANT_A, usuarioId: USER_A }
      )
    ).rejects.toThrow(OrderNotFoundError);

    expect(prisma.pedido.update).not.toHaveBeenCalled();
    expect(prisma.transacao.create).not.toHaveBeenCalled();
  });

  it("createOrder rejeita lanchonete_id com formato inválido", async () => {
    // lanchonete_id inválido (não é UUID) deve ser bloqueado antes do $queryRaw
    await expect(
      createOrder(
        { itens: [], forma_pagamento: "PIX" },
        { lanchoneteId: "nao-e-um-uuid", usuarioId: USER_A }
      )
    ).rejects.toThrow(OrderValidationError);

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("createOrder passa lanchonete_id do contexto para todos os dados persistidos", async () => {
    vi.mocked(prisma.produto.findMany).mockResolvedValue([
      {
        id:           "prod-1",
        lanchonete_id: TENANT_A,
        nome:         "X-Burguer",
        preco_venda:  new Prisma.Decimal(10),
        inativo_em:   null,
      } as never,
    ]);
    vi.mocked(prisma.produtoAdicional.findMany).mockResolvedValue([]);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ next_numero_pedido: 1 }]);
    vi.mocked(prisma.pedido.create).mockResolvedValue(mockPedido(TENANT_A) as never);

    await createOrder(
      {
        itens: [{ produto_id: "prod-1", quantidade: 1 }],
        forma_pagamento: "PIX",
      },
      { lanchoneteId: TENANT_A, usuarioId: USER_A }
    );

    const createCall = vi.mocked(prisma.pedido.create).mock.calls[0][0];
    expect(createCall?.data?.lanchonete_id).toBe(TENANT_A);
  });
});

// ─────────────────────────────────────────────────────────────
describe("Equipe — isolamento de tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listarMembros sempre filtra pelo lanchonete_id da sessão", async () => {
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([]);

    await listarMembros(TENANT_A);

    const call = vi.mocked(prisma.usuario.findMany).mock.calls[0][0];
    expect(call?.where?.lanchonete_id).toBe(TENANT_A);
  });

  it("convidarMembro cria usuário no tenant da sessão, ignorando qualquer id do body", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.usuario.create).mockResolvedValue({
      id: "novo-user", nome: "Ana", email: "ana@a.com",
      role: "CAIXA", ultimo_acesso_em: null, criado_em: new Date(),
    } as never);

    await convidarMembro(
      { nome: "Ana", email: "ana@a.com", senha: "Senha123", role: "CAIXA" },
      TENANT_A
    );

    const call = vi.mocked(prisma.usuario.create).mock.calls[0][0];
    expect(call?.data?.lanchonete_id).toBe(TENANT_A);
    // Garante que tenant B nunca aparece no create
    expect(call?.data?.lanchonete_id).not.toBe(TENANT_B);
  });

  it("convidarMembro verifica unicidade de email DENTRO do tenant correto", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.usuario.create).mockResolvedValue({} as never);

    await convidarMembro(
      { nome: "Ana", email: "ana@a.com", senha: "Senha123", role: "CAIXA" },
      TENANT_A
    );

    const findCall = vi.mocked(prisma.usuario.findUnique).mock.calls[0][0];
    expect(findCall?.where?.lanchonete_id_email?.lanchonete_id).toBe(TENANT_A);
  });
});

// ─────────────────────────────────────────────────────────────
describe("Estoque — isolamento de tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMovimentacoes sempre filtra pelo lanchonete_id da sessão", async () => {
    vi.mocked(prisma.movimentacaoEstoque.findMany).mockResolvedValue([]);

    await getMovimentacoes(TENANT_A);

    const call = vi.mocked(prisma.movimentacaoEstoque.findMany).mock.calls[0][0];
    expect(call?.where?.lanchonete_id).toBe(TENANT_A);
  });

  it("movimentarEstoque rejeita produto que não pertence ao tenant", async () => {
    // tx.produto.findFirst retorna null → produto não existe para TENANT_A
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => unknown) => {
      const tx = {
        produto:             { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
        movimentacaoEstoque: { create:    vi.fn() },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fn(tx as any);
    });

    await expect(
      movimentarEstoque(
        { produto_id: "prod-de-tenant-b", tipo: "ENTRADA", quantidade: 1 },
        { lanchoneteId: TENANT_A, usuarioId: USER_A }
      )
    ).rejects.toThrow(StockNotFoundError);
  });

  it("movimentarEstoque não executa update quando produto não pertence ao tenant", async () => {
    const mockUpdate = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => unknown) => {
      const tx = {
        produto:             { findFirst: vi.fn().mockResolvedValue(null), update: mockUpdate },
        movimentacaoEstoque: { create:    vi.fn() },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fn(tx as any);
    });

    await expect(
      movimentarEstoque(
        { produto_id: "prod-alheio", tipo: "SAIDA", quantidade: 1 },
        { lanchoneteId: TENANT_A, usuarioId: USER_A }
      )
    ).rejects.toThrow(StockNotFoundError);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("movimentarEstoque persiste a movimentação com lanchonete_id do contexto", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: "mov-1", lanchonete_id: TENANT_A });

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => unknown) => {
      const tx = {
        produto: {
          findFirst: vi.fn().mockResolvedValue({ id: "prod-1", estoque_atual: 10 }),
          update:    vi.fn().mockResolvedValue({ id: "prod-1", estoque_atual: 11 }),
        },
        movimentacaoEstoque: { create: mockCreate },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fn(tx as any);
    });

    await movimentarEstoque(
      { produto_id: "prod-1", tipo: "ENTRADA", quantidade: 1 },
      { lanchoneteId: TENANT_A, usuarioId: USER_A }
    );

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall?.data?.lanchonete_id).toBe(TENANT_A);
    expect(createCall?.data?.lanchonete_id).not.toBe(TENANT_B);
  });

  it("movimentarEstoque rejeita tipo inválido antes de acessar o banco", async () => {
    await expect(
      movimentarEstoque(
        { produto_id: "prod-1", tipo: "INVALIDO", quantidade: 1 },
        { lanchoneteId: TENANT_A, usuarioId: USER_A }
      )
    ).rejects.toThrow(StockValidationError);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
