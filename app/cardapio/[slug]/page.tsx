"use client";

import { useEffect, useRef, useState } from "react";
import { useParams }                    from "next/navigation";
import Image                            from "next/image";
import { ShoppingCart, Plus, Minus, X, ChevronRight, Check } from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────
interface Adicional {
  id: string; produto_id: string | null; nome: string;
  tipo: "ADICIONAL" | "EXCECAO"; preco_extra: number;
}
interface Produto {
  id: string; nome: string; descricao: string | null;
  preco_venda: number; imagem_url: string | null; categoria_id: string | null;
}
interface Categoria { id: string; nome: string; ordem: number }
interface CardapioData {
  lanchonete: { id: string; nome: string; logo_url: string | null; telefone: string | null };
  categorias: Categoria[];
  produtos:   Produto[];
  adicionais: Adicional[];
}
interface CartItem {
  produto:    Produto;
  quantidade: number;
  adicionais: Adicional[];
  total:      number;
}

const FORMAS = [
  { value: "PIX",            label: "Pix" },
  { value: "DINHEIRO",       label: "Dinheiro" },
  { value: "CARTAO_DEBITO",  label: "Débito" },
  { value: "CARTAO_CREDITO", label: "Crédito" },
] as const;

const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

// ── Componente principal ───────────────────────────────────────
export default function CardapioPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data,     setData]     = useState<CardapioData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [catAtiva,   setCatAtiva]   = useState<string | null>(null);
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [cartAberto, setCartAberto] = useState(false);

  // Modal de adicionais
  const [prodModal, setProdModal] = useState<Produto | null>(null);
  const [selAdics,  setSelAdics]  = useState<Adicional[]>([]);
  const [qtdModal,  setQtdModal]  = useState(1);

  // Checkout
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [nome,           setNome]           = useState("");
  const [telefone,       setTelefone]       = useState("");
  const [observacao,     setObservacao]     = useState("");
  const [pagamento,      setPagamento]      = useState<string>("PIX");
  const [enviando,       setEnviando]       = useState(false);
  const [pedidoNum,      setPedidoNum]      = useState<number | null>(null);

  const catBarRef = useRef<HTMLDivElement>(null);

  // Carrega cardápio
  useEffect(() => {
    fetch(`/api/public/${slug}/cardapio`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        const json = await r.json();
        setData(json);
        if (json.categorias.length > 0) setCatAtiva(json.categorias[0].id);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)  return <Loading />;
  if (notFound || !data) return <NotFound />;

  // Filtra produtos pela categoria ativa
  const produtosFiltrados = catAtiva
    ? data.produtos.filter((p) => p.categoria_id === catAtiva)
    : data.produtos;

  const totalCart   = cart.reduce((s, i) => s + i.total, 0);
  const totalItens  = cart.reduce((s, i) => s + i.quantidade, 0);

  // ── Handlers ──────────────────────────────────────────────────
  function abrirModal(produto: Produto) {
    const adics = data!.adicionais.filter(
      (a) => a.produto_id === produto.id || a.produto_id === null
    );
    if (adics.length === 0) {
      adicionarAoCart(produto, [], 1);
    } else {
      setProdModal(produto);
      setSelAdics([]);
      setQtdModal(1);
    }
  }

  function toggleAdicional(a: Adicional) {
    setSelAdics((prev) =>
      prev.find((x) => x.id === a.id)
        ? prev.filter((x) => x.id !== a.id)
        : [...prev, a]
    );
  }

  function adicionarAoCart(produto: Produto, adics: Adicional[], qtd: number) {
    const extras = adics
      .filter((a) => a.tipo === "ADICIONAL")
      .reduce((s, a) => s + a.preco_extra, 0);
    const total = (produto.preco_venda + extras) * qtd;

    setCart((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.produto.id === produto.id &&
          i.adicionais.map((a) => a.id).sort().join(",") ===
            adics.map((a) => a.id).sort().join(",")
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantidade: updated[idx].quantidade + qtd,
          total:      updated[idx].total + total,
        };
        return updated;
      }
      return [...prev, { produto, quantidade: qtd, adicionais: adics, total }];
    });
    setProdModal(null);
  }

  function removerItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  async function enviarPedido() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/public/${slug}/pedidos`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: cart.map((i) => ({
            produto_id:  i.produto.id,
            quantidade:  i.quantidade,
            adicionais:  i.adicionais.map((a) => ({ produto_adicional_id: a.id })),
          })),
          forma_pagamento: pagamento,
          observacao:      observacao || null,
          cliente_nome:    nome || undefined,
          cliente_tel:     telefone || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erro ao enviar pedido");
      const json = await res.json();
      setPedidoNum(json.numero_pedido);
      setCart([]);
    } finally {
      setEnviando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] pb-32">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#2d2d3d] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.lanchonete.logo_url ? (
              <Image
                src={data.lanchonete.logo_url}
                alt={data.lanchonete.nome}
                width={36} height={36}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                {data.lanchonete.nome[0]}
              </div>
            )}
            <span className="font-bold text-white truncate">{data.lanchonete.nome}</span>
          </div>
          {totalItens > 0 && (
            <button
              onClick={() => setCartAberto(true)}
              className="relative p-2 text-orange-400"
            >
              <ShoppingCart size={22} />
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItens}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Hero da loja */}
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-3 border-b border-[#2d2d3d]">
        {data.lanchonete.logo_url ? (
          <Image
            src={data.lanchonete.logo_url}
            alt={data.lanchonete.nome}
            width={96} height={96}
            className="rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-4xl shadow-lg">
            {data.lanchonete.nome[0]}
          </div>
        )}
        <h1 className="text-xl font-bold text-white text-center">{data.lanchonete.nome}</h1>
      </div>

      {/* Filtro de categorias */}
      {data.categorias.length > 0 && (
        <div
          ref={catBarRef}
          className="sticky top-[57px] z-20 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#2d2d3d] overflow-x-auto"
        >
          <div className="flex gap-2 px-4 py-2.5 max-w-2xl mx-auto">
            <button
              onClick={() => setCatAtiva(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                catAtiva === null
                  ? "bg-orange-500 text-white"
                  : "bg-[#1a1a2e] text-gray-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            {data.categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatAtiva(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  catAtiva === c.id
                    ? "bg-orange-500 text-white"
                    : "bg-[#1a1a2e] text-gray-400 hover:text-white"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de produtos */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {produtosFiltrados.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Nenhum produto nesta categoria</p>
        ) : (
          produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onAdicionar={() => abrirModal(produto)}
            />
          ))
        )}
      </main>

      {/* FAB do carrinho */}
      {totalItens > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4">
          <button
            onClick={() => setCartAberto(true)}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-lg shadow-orange-900/40 transition-colors w-full max-w-sm"
          >
            <span className="bg-orange-400/30 rounded-lg px-2 py-0.5 text-sm tabular-nums">
              {totalItens}
            </span>
            <span className="flex-1 text-left">Ver carrinho</span>
            <span className="tabular-nums">{fmtBRL(totalCart)}</span>
          </button>
        </div>
      )}

      {/* Modal de adicionais */}
      {prodModal && (
        <ModalAdicionais
          produto={prodModal}
          adicionais={data.adicionais.filter(
            (a) => a.produto_id === prodModal.id || a.produto_id === null
          )}
          selAdics={selAdics}
          quantidade={qtdModal}
          onToggleAdicional={toggleAdicional}
          onChangeQtd={setQtdModal}
          onConfirmar={() => adicionarAoCart(prodModal, selAdics, qtdModal)}
          onFechar={() => setProdModal(null)}
        />
      )}

      {/* Drawer do carrinho */}
      {cartAberto && (
        <DrawerCarrinho
          cart={cart}
          total={totalCart}
          onRemover={removerItem}
          onFechar={() => setCartAberto(false)}
          onCheckout={() => { setCartAberto(false); setCheckoutAberto(true); }}
        />
      )}

      {/* Checkout */}
      {checkoutAberto && pedidoNum === null && (
        <ModalCheckout
          total={totalCart}
          nome={nome} onNome={setNome}
          telefone={telefone} onTelefone={setTelefone}
          observacao={observacao} onObservacao={setObservacao}
          pagamento={pagamento} onPagamento={setPagamento}
          enviando={enviando}
          onEnviar={enviarPedido}
          onFechar={() => setCheckoutAberto(false)}
        />
      )}

      {/* Confirmação */}
      {pedidoNum !== null && (
        <ConfirmacaoPedido
          numeroPedido={pedidoNum}
          onNovoPedido={() => { setPedidoNum(null); setCheckoutAberto(false); }}
        />
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────

function ProdutoCard({ produto, onAdicionar }: { produto: Produto; onAdicionar: () => void }) {
  return (
    <div className="flex gap-3 bg-[#111118] border border-[#2d2d3d] rounded-xl p-3">
      {produto.imagem_url && (
        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden">
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            width={80} height={80}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-semibold text-white text-sm leading-snug">{produto.nome}</p>
          {produto.descricao && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{produto.descricao}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-orange-400 font-bold text-sm">
            {fmtBRL(produto.preco_venda)}
          </span>
          <button
            onClick={onAdicionar}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={12} />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalAdicionais({
  produto, adicionais, selAdics, quantidade,
  onToggleAdicional, onChangeQtd, onConfirmar, onFechar,
}: {
  produto: Produto; adicionais: Adicional[]; selAdics: Adicional[];
  quantidade: number;
  onToggleAdicional: (a: Adicional) => void;
  onChangeQtd: (q: number) => void;
  onConfirmar: () => void; onFechar: () => void;
}) {
  const extras = selAdics
    .filter((a) => a.tipo === "ADICIONAL")
    .reduce((s, a) => s + a.preco_extra, 0);
  const totalUnitario = produto.preco_venda + extras;
  const totalFinal    = totalUnitario * quantidade;

  return (
    <Overlay onFechar={onFechar}>
      <div className="bg-[#111118] border border-[#2d2d3d] rounded-2xl p-5 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-white">{produto.nome}</p>
            <p className="text-orange-400 text-sm">{fmtBRL(produto.preco_venda)}</p>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {adicionais.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Adicionais</p>
            {adicionais.map((a) => {
              const sel = !!selAdics.find((x) => x.id === a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => onToggleAdicional(a)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                    sel
                      ? "border-orange-500 bg-orange-500/10 text-white"
                      : "border-[#2d2d3d] text-gray-400 hover:text-white"
                  }`}
                >
                  <span>{a.nome}</span>
                  <span className="flex items-center gap-2">
                    {a.tipo === "ADICIONAL" && a.preco_extra > 0 && (
                      <span className="text-xs text-gray-500">+{fmtBRL(a.preco_extra)}</span>
                    )}
                    {sel && <Check size={14} className="text-orange-400" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quantidade */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">Quantidade</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChangeQtd(Math.max(1, quantidade - 1))}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:text-white"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center font-bold text-white">{quantidade}</span>
            <button
              onClick={() => onChangeQtd(quantidade + 1)}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={onConfirmar}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-between px-4 transition-colors"
        >
          <span>Adicionar ao carrinho</span>
          <span>{fmtBRL(totalFinal)}</span>
        </button>
      </div>
    </Overlay>
  );
}

function DrawerCarrinho({
  cart, total, onRemover, onFechar, onCheckout,
}: {
  cart: CartItem[]; total: number;
  onRemover: (i: number) => void; onFechar: () => void; onCheckout: () => void;
}) {
  return (
    <Overlay onFechar={onFechar}>
      <div
        className="bg-[#111118] border border-[#2d2d3d] rounded-2xl p-5 w-full max-w-sm mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-white">Seu pedido</p>
          <button onClick={onFechar} className="text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cart.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">
                  {item.quantidade}× {item.produto.nome}
                </p>
                {item.adicionais.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.adicionais.map((a) => a.nome).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-orange-400 font-semibold">{fmtBRL(item.total)}</span>
                <button
                  onClick={() => onRemover(i)}
                  className="text-gray-600 hover:text-red-400 p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-[#2d2d3d] mt-4 pt-4">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-bold">{fmtBRL(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-between px-4 transition-colors"
          >
            <span>Finalizar pedido</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function ModalCheckout({
  total, nome, onNome, telefone, onTelefone,
  observacao, onObservacao, pagamento, onPagamento,
  enviando, onEnviar, onFechar,
}: {
  total: number;
  nome: string; onNome: (v: string) => void;
  telefone: string; onTelefone: (v: string) => void;
  observacao: string; onObservacao: (v: string) => void;
  pagamento: string; onPagamento: (v: string) => void;
  enviando: boolean; onEnviar: () => void; onFechar: () => void;
}) {
  return (
    <Overlay onFechar={onFechar}>
      <div
        className="bg-[#111118] border border-[#2d2d3d] rounded-2xl p-5 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-white">Finalizar pedido</p>
          <button onClick={onFechar} className="text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Dados pessoais (opcionais) */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Seus dados <span className="normal-case font-normal">(opcional)</span>
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => onNome(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2d2d3d] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
              <input
                type="tel"
                placeholder="Telefone / WhatsApp"
                value={telefone}
                onChange={(e) => onTelefone(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2d2d3d] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onPagamento(f.value)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    pagamento === f.value
                      ? "border-orange-500 bg-orange-500/10 text-white"
                      : "border-[#2d2d3d] text-gray-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Observação</p>
            <textarea
              placeholder="Alguma observação? (Ex: sem cebola, ponto da carne...)"
              value={observacao}
              onChange={(e) => onObservacao(e.target.value)}
              rows={3}
              className="w-full bg-[#1a1a2e] border border-[#2d2d3d] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="border-t border-[#2d2d3d] mt-5 pt-4">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-bold">{fmtBRL(total)}</span>
          </div>
          <button
            onClick={onEnviar}
            disabled={enviando}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {enviando ? "Enviando…" : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function ConfirmacaoPedido({ numeroPedido, onNovoPedido }: { numeroPedido: number; onNovoPedido: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/95 px-4">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Pedido enviado!</h2>
        <p className="text-gray-400 text-sm mb-1">
          Seu pedido foi recebido com sucesso.
        </p>
        <p className="text-orange-400 font-bold text-2xl mb-6">#{numeroPedido}</p>
        <button
          onClick={onNovoPedido}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Fazer novo pedido
        </button>
      </div>
    </div>
  );
}

function Overlay({ children, onFechar }: { children: React.ReactNode; onFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-0"
      onClick={onFechar}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-center px-4">
      <p className="text-4xl mb-3">🍔</p>
      <h1 className="text-xl font-bold text-white mb-1">Cardápio não encontrado</h1>
      <p className="text-gray-500 text-sm">Verifique o link e tente novamente.</p>
    </div>
  );
}
