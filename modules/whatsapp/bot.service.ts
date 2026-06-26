import { prisma }      from "@/lib/prisma";
import { enviarMensagem, type EvolutionConfig } from "@/lib/evolution";
import { createOrder }  from "@/modules/orders/orders.service";

// ── Tipos internos ────────────────────────────────────────────────

interface CarrinhoItem {
  produto_id: string;
  nome:       string;
  preco:      number;
  qtd:        number;
}

interface SessaoDados {
  carrinho:          CarrinhoItem[];
  menu_map?:         Record<string, string>; // número digitado → produto_id
  tipo_entrega?:     "BALCAO" | "DELIVERY";
  endereco_entrega?: string;
}

type EstadoBot = "MENU" | "CARRINHO" | "TIPO_ENTREGA" | "ENDERECO" | "PAGAMENTO";

const SESSAO_TTL_MIN = 30;

const FORMAS        = ["DINHEIRO", "CARTAO_DEBITO", "CARTAO_CREDITO", "PIX"] as const;
const FORMAS_LABELS = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX"];

const GATILHOS_RESET = ["cancelar", "sair", "reiniciar", "oi", "olá", "ola", "menu", "cardápio", "cardapio", "boa tarde", "boa noite", "bom dia"];

// ── Sessão ────────────────────────────────────────────────────────

function novaExpiracao() {
  return new Date(Date.now() + SESSAO_TTL_MIN * 60 * 1000);
}

async function getSessao(lanchoneteId: string, telefone: string): Promise<{ estado: EstadoBot; dados: SessaoDados }> {
  const sess = await prisma.sessaoWhatsApp.findUnique({
    where: { lanchonete_id_telefone: { lanchonete_id: lanchoneteId, telefone } },
  });
  if (!sess || sess.expira_em < new Date()) {
    return { estado: "MENU", dados: { carrinho: [] } };
  }
  return { estado: sess.estado as EstadoBot, dados: sess.dados as unknown as SessaoDados };
}

async function setSessao(lanchoneteId: string, telefone: string, estado: EstadoBot, dados: SessaoDados) {
  await prisma.sessaoWhatsApp.upsert({
    where:  { lanchonete_id_telefone: { lanchonete_id: lanchoneteId, telefone } },
    create: { lanchonete_id: lanchoneteId, telefone, estado, dados: dados as object, expira_em: novaExpiracao() },
    update: { estado, dados: dados as object, expira_em: novaExpiracao() },
  });
}

async function resetSessao(lanchoneteId: string, telefone: string) {
  await prisma.sessaoWhatsApp.deleteMany({
    where: { lanchonete_id: lanchoneteId, telefone },
  });
}

// ── Mensagens ─────────────────────────────────────────────────────

async function enviar(
  cfg:           EvolutionConfig,
  lanchoneteId:  string,
  clienteId:     string | null,
  telefone:      string,
  texto:         string,
  tipo:          "CUSTOM" | "CONFIRMACAO_PEDIDO" = "CUSTOM",
) {
  try {
    const res = await enviarMensagem(cfg, telefone, texto);
    await prisma.mensagemWhatsApp.create({
      data: {
        lanchonete_id:   lanchoneteId,
        cliente_id:      clienteId,
        numero_destino:  telefone,
        mensagem:        texto,
        tipo,
        id_mensagem_wpp: res?.key?.id ?? null,
      },
    });
  } catch (err) {
    console.error("[bot] falha ao enviar mensagem:", err);
  }
}

// ── Cardápio ──────────────────────────────────────────────────────

async function buildMenu(lanchoneteId: string): Promise<{ texto: string; menu_map: Record<string, string> }> {
  const categorias = await prisma.categoria.findMany({
    where:   { lanchonete_id: lanchoneteId },
    orderBy: { ordem: "asc" },
    include: {
      produtos: {
        where:   { lanchonete_id: lanchoneteId, inativo_em: null },
        orderBy: { nome: "asc" },
        select:  { id: true, nome: true, preco_venda: true },
      },
    },
  });

  const menu_map: Record<string, string> = {};
  let num = 1;
  const linhas: string[] = [];

  for (const cat of categorias) {
    if (!cat.produtos.length) continue;
    linhas.push(`\n*${cat.nome.toUpperCase()}*`);
    for (const prod of cat.produtos) {
      const preco = Number(prod.preco_venda).toFixed(2).replace(".", ",");
      linhas.push(`${num}. ${prod.nome} — R$ ${preco}`);
      menu_map[String(num)] = prod.id;
      num++;
    }
  }

  if (!linhas.length) {
    return { texto: "Nosso cardápio está sendo atualizado. Volte em breve! 🍔", menu_map: {} };
  }

  const texto =
    "📋 *CARDÁPIO*\n─────────────" +
    linhas.join("\n") +
    "\n\nDigite o *número* do item para adicionar ao pedido.";

  return { texto, menu_map };
}

// ── Formatação do carrinho ─────────────────────────────────────────

function formatCarrinho(carrinho: CarrinhoItem[]): string {
  const linhas = carrinho.map(
    (i) => `• ${i.qtd}x ${i.nome} — R$ ${(i.preco * i.qtd).toFixed(2).replace(".", ",")}`
  );
  const total = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0).toFixed(2).replace(".", ",");
  return linhas.join("\n") + `\n\n*Total: R$ ${total}*`;
}

// ── Máquina de estados ────────────────────────────────────────────

export async function processarMensagemBot(
  lanchoneteId: string,
  clienteId:    string | null,
  telefone:     string,
  pushName:     string,
  texto:        string,
  cfg:          EvolutionConfig,
) {
  const textoNorm = texto.trim().toLowerCase();

  let { estado, dados } = await getSessao(lanchoneteId, telefone);

  // Gatilhos globais que reiniciam a conversa
  if (GATILHOS_RESET.some((k) => textoNorm === k || textoNorm.startsWith(k + " "))) {
    estado = "MENU";
    dados  = { carrinho: [] };
  }

  // ── MENU ──────────────────────────────────────────────────────────
  if (estado === "MENU") {
    const lanchonete = await prisma.lanchonete.findUnique({
      where:  { id: lanchoneteId },
      select: { nome: true },
    });

    const { texto: menuTexto, menu_map } = await buildMenu(lanchoneteId);

    const saudacao = `Olá, ${pushName}! 👋 Bem-vindo(a) ao *${lanchonete?.nome ?? "restaurante"}*.\n\n`;
    await enviar(cfg, lanchoneteId, clienteId, telefone, saudacao + menuTexto);
    await setSessao(lanchoneteId, telefone, "CARRINHO", { carrinho: [], menu_map });
    return;
  }

  // ── CARRINHO ──────────────────────────────────────────────────────
  if (estado === "CARRINHO") {
    // Confirmar pedido
    if (["0", "confirmar", "ok", "finalizar", "pronto", "fechar"].includes(textoNorm)) {
      if (!dados.carrinho?.length) {
        await enviar(cfg, lanchoneteId, clienteId, telefone, "Seu carrinho está vazio. 🛒 Adicione itens antes de confirmar.");
        return;
      }
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        `📦 *Como deseja receber seu pedido?*\n\n1. Retirar no balcão\n2. Delivery`);
      await setSessao(lanchoneteId, telefone, "TIPO_ENTREGA", dados);
      return;
    }

    // Remover item (ex: "r 2" ou "remover 2")
    const matchRemover = textoNorm.match(/^(?:r|remover)\s+(\d+)$/);
    if (matchRemover) {
      const prodId = dados.menu_map?.[matchRemover[1]];
      if (prodId) {
        dados.carrinho = dados.carrinho.filter((i) => i.produto_id !== prodId);
        const msg = dados.carrinho.length
          ? `Removido! 🗑️\n\n🛒 *Carrinho:*\n${formatCarrinho(dados.carrinho)}\n\nDigite outro número, *0* para confirmar ou *cancelar*.`
          : "Carrinho esvaziado. Digite o número de um item para recomeçar.";
        await enviar(cfg, lanchoneteId, clienteId, telefone, msg);
        await setSessao(lanchoneteId, telefone, "CARRINHO", dados);
      } else {
        await enviar(cfg, lanchoneteId, clienteId, telefone, "Número inválido. Tente novamente.");
      }
      return;
    }

    // Adicionar item pelo número
    const prodId = dados.menu_map?.[textoNorm];
    if (prodId) {
      const produto = await prisma.produto.findFirst({
        where:  { id: prodId, lanchonete_id: lanchoneteId, inativo_em: null },
        select: { id: true, nome: true, preco_venda: true },
      });
      if (!produto) {
        await enviar(cfg, lanchoneteId, clienteId, telefone, "Produto indisponível no momento. Escolha outro.");
        return;
      }
      const preco    = Number(produto.preco_venda);
      const existing = dados.carrinho.find((i) => i.produto_id === prodId);
      if (existing) { existing.qtd++; }
      else          { dados.carrinho.push({ produto_id: produto.id, nome: produto.nome, preco, qtd: 1 }); }

      const msg =
        `✅ *${produto.nome}* adicionado!\n\n` +
        `🛒 *Carrinho:*\n${formatCarrinho(dados.carrinho)}\n\n` +
        `Digite outro número para adicionar mais, *0* para finalizar ou *cancelar*.`;
      await enviar(cfg, lanchoneteId, clienteId, telefone, msg);
      await setSessao(lanchoneteId, telefone, "CARRINHO", dados);
      return;
    }

    await enviar(cfg, lanchoneteId, clienteId, telefone,
      `Não entendi. 🤔\nDigite o *número* do item, *0* para finalizar ou *cardápio* para ver o menu.`);
    return;
  }

  // ── TIPO_ENTREGA ──────────────────────────────────────────────────
  if (estado === "TIPO_ENTREGA") {
    if (textoNorm === "1") {
      dados.tipo_entrega = "BALCAO";
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        `💳 *Como deseja pagar?*\n\n1. Dinheiro\n2. Cartão de Débito\n3. Cartão de Crédito\n4. PIX`);
      await setSessao(lanchoneteId, telefone, "PAGAMENTO", dados);
      return;
    }
    if (textoNorm === "2") {
      dados.tipo_entrega = "DELIVERY";
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        `📍 Qual é o seu *endereço de entrega*?\n(Rua, número, bairro)`);
      await setSessao(lanchoneteId, telefone, "ENDERECO", dados);
      return;
    }
    await enviar(cfg, lanchoneteId, clienteId, telefone,
      `Digite *1* para retirar no balcão ou *2* para delivery.`);
    return;
  }

  // ── ENDERECO ──────────────────────────────────────────────────────
  if (estado === "ENDERECO") {
    if (texto.trim().length < 5) {
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        "Por favor, informe o endereço completo (rua, número, bairro).");
      return;
    }
    dados.endereco_entrega = texto.trim();
    await enviar(cfg, lanchoneteId, clienteId, telefone,
      `💳 *Como deseja pagar?*\n\n1. Dinheiro\n2. Cartão de Débito\n3. Cartão de Crédito\n4. PIX`);
    await setSessao(lanchoneteId, telefone, "PAGAMENTO", dados);
    return;
  }

  // ── PAGAMENTO ─────────────────────────────────────────────────────
  if (estado === "PAGAMENTO") {
    const idx = parseInt(textoNorm) - 1;
    if (isNaN(idx) || idx < 0 || idx > 3) {
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        `Digite *1* Dinheiro, *2* Débito, *3* Crédito ou *4* PIX.`);
      return;
    }

    const usuario = await prisma.usuario.findFirst({
      where:  { lanchonete_id: lanchoneteId, role: "ADMIN", inativo_em: null },
      select: { id: true },
    });
    if (!usuario) {
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        "Erro interno. Por favor, ligue para nós para fazer seu pedido.");
      return;
    }

    try {
      const pedido = await createOrder(
        {
          itens:            dados.carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.qtd })),
          forma_pagamento:  FORMAS[idx],
          origem:           "WHATSAPP",
          cliente_id:       clienteId,
          tipo_entrega:     dados.tipo_entrega ?? "BALCAO",
          endereco_entrega: dados.endereco_entrega ?? null,
        },
        { lanchoneteId, usuarioId: usuario.id },
      );

      const totalFmt = Number(pedido.total).toFixed(2).replace(".", ",");
      const linhasPedido = pedido.itens.map(
        (i) => `• ${i.quantidade}x ${i.produto_nome} — R$ ${Number(i.total).toFixed(2).replace(".", ",")}`
      );

      const confirmacao =
        `✅ *Pedido #${pedido.numero_pedido} confirmado!*\n` +
        `────────────────────\n` +
        linhasPedido.join("\n") +
        `\n\n*Total: R$ ${totalFmt}*\n` +
        (dados.tipo_entrega === "DELIVERY"
          ? `📍 Entrega: ${dados.endereco_entrega}\n`
          : `🏠 Retirada no balcão\n`) +
        `💳 Pagamento: ${FORMAS_LABELS[idx]}\n\n` +
        `⏱ Acompanhe seu pedido. Obrigado! 😊`;

      await enviar(cfg, lanchoneteId, clienteId, telefone, confirmacao, "CONFIRMACAO_PEDIDO");
      await resetSessao(lanchoneteId, telefone);
    } catch (err) {
      console.error("[bot] erro ao criar pedido:", err);
      await enviar(cfg, lanchoneteId, clienteId, telefone,
        "Não consegui registrar seu pedido. Por favor, tente novamente ou ligue para nós.");
    }
    return;
  }
}
