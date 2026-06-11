"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Search } from "lucide-react";
import type { ProdutoDTO, FormaPagamento, ItemAdicionalDTO } from "@/types";

interface LinhaCarrinho {
  produto:     ProdutoDTO;
  quantidade:  number;
  adicionais:  (ItemAdicionalDTO & { selecionado: boolean })[];
}

interface Props {
  onClose:  () => void;
  onSalvo:  () => void;
}

const FORMA_OPTS: { value: FormaPagamento; label: string }[] = [
  { value: "DINHEIRO",       label: "Dinheiro"  },
  { value: "PIX",            label: "PIX"        },
  { value: "CARTAO_DEBITO",  label: "Débito"     },
  { value: "CARTAO_CREDITO", label: "Crédito"    },
  { value: "FIADO",          label: "Fiado"      },
];

export function NovoPedidoModal({ onClose, onSalvo }: Props) {
  const [produtos,    setProdutos]    = useState<ProdutoDTO[]>([]);
  const [busca,       setBusca]       = useState("");
  const [carrinho,    setCarrinho]    = useState<LinhaCarrinho[]>([]);
  const [forma,       setForma]       = useState<FormaPagamento>("PIX");
  const [obs,         setObs]         = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [salvando,    setSalvando]    = useState(false);

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then(setProdutos);
  }, []);

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function adicionarProduto(produto: ProdutoDTO) {
    setCarrinho((prev) => {
      const existente = prev.find((l) => l.produto.id === produto.id);
      if (existente) {
        return prev.map((l) =>
          l.produto.id === produto.id
            ? { ...l, quantidade: l.quantidade + 1 }
            : l
        );
      }
      return [
        ...prev,
        {
          produto,
          quantidade: 1,
          adicionais: produto.adicionais.map((a) => ({ ...a, selecionado: false })),
        },
      ];
    });
  }

  function ajustarQtd(produtoId: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((l) =>
          l.produto.id === produtoId
            ? { ...l, quantidade: l.quantidade + delta }
            : l
        )
        .filter((l) => l.quantidade > 0)
    );
  }

  function toggleAdicional(produtoId: string, adicionalId: string) {
    setCarrinho((prev) =>
      prev.map((l) =>
        l.produto.id === produtoId
          ? {
              ...l,
              adicionais: l.adicionais.map((a) =>
                a.id === adicionalId ? { ...a, selecionado: !a.selecionado } : a
              ),
            }
          : l
      )
    );
  }

  const total = carrinho.reduce((acc, l) => {
    const extras = l.adicionais
      .filter((a) => a.selecionado && a.tipo === "ADICIONAL")
      .reduce((s, a) => s + a.preco_extra, 0);
    return acc + (l.produto.preco_venda + extras) * l.quantidade;
  }, 0);

  async function salvar() {
    if (carrinho.length === 0) return;
    setSalvando(true);
    try {
      const body = {
        forma_pagamento: forma,
        observacao:      obs || null,
        cliente_nome:    clienteNome || null,
        itens: carrinho.map((l) => ({
          produto_id:    l.produto.id,
          produto_nome:  l.produto.nome,
          preco_unitario: l.produto.preco_venda,
          quantidade:    l.quantidade,
          adicionais:    l.adicionais
            .filter((a) => a.selecionado)
            .map((a) => ({
              produto_adicional_id: a.id,
              nome:       a.nome,
              tipo:       a.tipo,
              preco_extra: a.preco_extra,
            })),
        })),
      };
      const res = await fetch("/api/pedidos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    bg-black/70 px-0 sm:px-4">
      <div className="w-full max-w-2xl bg-dark-800 border border-dark-600
                      rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92dvh]">

        {/* Header do modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 shrink-0">
          <h2 className="font-bold text-white">Novo Pedido</h2>
          <button onClick={onClose} className="btn-ghost px-2">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-0 flex-1 min-h-0">

          {/* Coluna esquerda — cardápio */}
          <div className="flex flex-col sm:w-1/2 border-r border-dark-600 min-h-0">
            <div className="p-3 border-b border-dark-600">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="search"
                  placeholder="Buscar produto…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full h-9 bg-dark-700 border border-dark-600 rounded-lg
                             pl-8 pr-3 text-sm text-white placeholder:text-gray-600
                             focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {produtosFiltrados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => adicionarProduto(p)}
                  className="w-full flex items-center justify-between px-3 py-2
                             min-h-[44px] bg-dark-700 hover:bg-dark-600
                             rounded-lg text-left transition-colors"
                >
                  <span className="text-sm text-white truncate">{p.nome}</span>
                  <span className="text-xs text-brand-400 font-semibold shrink-0 ml-2">
                    R$ {p.preco_venda.toFixed(2).replace(".", ",")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Coluna direita — carrinho */}
          <div className="flex flex-col sm:w-1/2 min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {carrinho.length === 0 && (
                <p className="text-sm text-gray-600 text-center mt-8">
                  Selecione produtos ao lado
                </p>
              )}
              {carrinho.map((linha) => (
                <div key={linha.produto.id}
                     className="bg-dark-700 rounded-xl p-3 border border-dark-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white truncate">
                      {linha.produto.nome}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => ajustarQtd(linha.produto.id, -1)}
                        className="w-7 h-7 flex items-center justify-center
                                   bg-dark-600 hover:bg-dark-500 rounded-lg text-white"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-white w-4 text-center">
                        {linha.quantidade}
                      </span>
                      <button
                        onClick={() => ajustarQtd(linha.produto.id, +1)}
                        className="w-7 h-7 flex items-center justify-center
                                   bg-dark-600 hover:bg-dark-500 rounded-lg text-white"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Adicionais */}
                  {linha.adicionais.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {linha.adicionais.map((ad) => (
                        <button
                          key={ad.id}
                          onClick={() => toggleAdicional(linha.produto.id, ad.id)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            ad.selecionado
                              ? ad.tipo === "ADICIONAL"
                                ? "bg-brand-500/20 border-brand-500/40 text-brand-400"
                                : "bg-red-500/20 border-red-500/40 text-red-400"
                              : "border-dark-500 text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {ad.tipo === "ADICIONAL" ? "+" : "−"} {ad.nome}
                          {ad.tipo === "ADICIONAL" && ad.preco_extra > 0
                            ? ` R$${ad.preco_extra.toFixed(2)}`
                            : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rodapé do carrinho */}
            <div className="p-3 border-t border-dark-600 space-y-2 shrink-0">
              <input
                type="text"
                placeholder="Nome do cliente (opcional)"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full h-9 bg-dark-700 border border-dark-600 rounded-lg
                           px-3 text-sm text-white placeholder:text-gray-600
                           focus:border-brand-500 focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="Observações…"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg
                           px-3 py-2 text-sm text-white placeholder:text-gray-600
                           focus:border-brand-500 focus:outline-none resize-none"
              />

              {/* Forma de pagamento */}
              <div className="flex gap-1.5 flex-wrap">
                {FORMA_OPTS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setForma(o.value)}
                    className={`px-3 min-h-[36px] rounded-lg text-xs font-semibold
                                border transition-colors ${
                      forma === o.value
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-dark-500 text-gray-400 hover:text-white"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
                <button
                  onClick={salvar}
                  disabled={salvando || carrinho.length === 0}
                  className="btn-primary disabled:opacity-50"
                >
                  {salvando ? "Salvando…" : "Confirmar pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
