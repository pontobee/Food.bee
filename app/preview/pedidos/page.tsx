"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Banknote, CreditCard, QrCode, Clock, ChevronRight, X } from "lucide-react";
import type { PedidoDTO, StatusPedido } from "@/types";

// ── Dados de demonstração ────────────────────────────────
const now = new Date().toISOString();
const minus = (m: number) => new Date(Date.now() - m * 60000).toISOString();

const MOCK_PEDIDOS: PedidoDTO[] = [
  {
    id: "1", numero_pedido: 23, status: "AGUARDANDO",
    forma_pagamento: "PIX", origem: "BALCAO",
    subtotal: 52.8, desconto: 0, total: 52.8, troco: null,
    observacao: "Sem cebola no hamburguer",
    criado_em: minus(3), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: { id: "c1", nome: "João Silva", telefone: "11999990001" },
    itens: [
      { id: "i1", produto_nome: "X-Bacon Duplo", produto_preco_unitario: 31.9, quantidade: 1, total: 31.9,
        adicionais: [
          { id: "a1", nome: "Queijo Extra", tipo: "ADICIONAL", preco_extra: 3 },
          { id: "a2", nome: "Sem Cebola",   tipo: "EXCECAO",   preco_extra: 0 },
        ] },
      { id: "i2", produto_nome: "Coca-Cola 350ml", produto_preco_unitario: 6, quantidade: 1, total: 6, adicionais: [] },
      { id: "i3", produto_nome: "Batata Frita P",  produto_preco_unitario: 10.9, quantidade: 1, total: 10.9, adicionais: [] },
    ],
  },
  {
    id: "2", numero_pedido: 22, status: "AGUARDANDO",
    forma_pagamento: "DINHEIRO", origem: "WHATSAPP",
    subtotal: 29.9, desconto: 0, total: 29.9, troco: 10.1,
    observacao: null,
    criado_em: minus(6), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: null,
    itens: [
      { id: "i4", produto_nome: "X-Burguer Clássico", produto_preco_unitario: 22.9, quantidade: 1, total: 22.9,
        adicionais: [{ id: "a3", nome: "Bacon Extra", tipo: "ADICIONAL", preco_extra: 4 }] },
      { id: "i5", produto_nome: "Suco de Laranja", produto_preco_unitario: 8, quantidade: 1, total: 8, adicionais: [] },
    ],
  },
  {
    id: "3", numero_pedido: 21, status: "EM_PREPARO",
    forma_pagamento: "CARTAO_DEBITO", origem: "BALCAO",
    subtotal: 44.5, desconto: 0, total: 44.5, troco: null,
    observacao: null,
    criado_em: minus(18), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: { id: "c2", nome: "Maria Santos", telefone: "11999990002" },
    itens: [
      { id: "i6", produto_nome: "X-Bacon Duplo", produto_preco_unitario: 31.9, quantidade: 1, total: 31.9, adicionais: [] },
      { id: "i7", produto_nome: "Onion Rings",   produto_preco_unitario: 14.9, quantidade: 1, total: 14.9,
        adicionais: [] },
    ],
  },
  {
    id: "4", numero_pedido: 20, status: "EM_PREPARO",
    forma_pagamento: "PIX", origem: "BALCAO",
    subtotal: 22.9, desconto: 0, total: 22.9, troco: null,
    observacao: "Ponto da carne: bem passado",
    criado_em: minus(35), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: { id: "c3", nome: "Carlos Mendes", telefone: "11999990003" },
    itens: [
      { id: "i8", produto_nome: "X-Burguer Clássico", produto_preco_unitario: 22.9, quantidade: 1, total: 22.9,
        adicionais: [{ id: "a4", nome: "Sem Alface", tipo: "EXCECAO", preco_extra: 0 }] },
    ],
  },
  {
    id: "5", numero_pedido: 19, status: "PRONTO",
    forma_pagamento: "CARTAO_CREDITO", origem: "BALCAO",
    subtotal: 67.2, desconto: 0, total: 67.2, troco: null,
    observacao: null,
    criado_em: minus(22), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: { id: "c4", nome: "Ana Lima", telefone: "11999990004" },
    itens: [
      { id: "i9",  produto_nome: "X-Bacon Duplo",  produto_preco_unitario: 31.9, quantidade: 2, total: 63.8, adicionais: [] },
      { id: "i10", produto_nome: "Coca-Cola 350ml", produto_preco_unitario: 6,    quantidade: 1, total: 6,   adicionais: [] },
    ],
  },
  {
    id: "6", numero_pedido: 18, status: "ENTREGUE",
    forma_pagamento: "PIX", origem: "BALCAO",
    subtotal: 38.9, desconto: 0, total: 38.9, troco: null,
    observacao: null,
    criado_em: minus(45), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: { id: "c5", nome: "Pedro Costa", telefone: "11999990005" },
    itens: [
      { id: "i11", produto_nome: "X-Burguer Clássico", produto_preco_unitario: 22.9, quantidade: 1, total: 22.9, adicionais: [] },
      { id: "i12", produto_nome: "Batata Frita P",     produto_preco_unitario: 10.9, quantidade: 1, total: 10.9, adicionais: [] },
      { id: "i13", produto_nome: "Suco de Laranja",    produto_preco_unitario: 8,    quantidade: 1, total: 8,    adicionais: [] },
    ],
  },
  {
    id: "7", numero_pedido: 17, status: "CANCELADO",
    forma_pagamento: "DINHEIRO", origem: "WHATSAPP",
    subtotal: 22.9, desconto: 0, total: 22.9, troco: null,
    observacao: null,
    criado_em: minus(60), atualizado_em: now, pago_em: null, tipo_entrega: "BALCAO" as const, taxa_entrega: null, endereco_entrega: null,
    cliente: null,
    itens: [
      { id: "i14", produto_nome: "X-Burguer Clássico", produto_preco_unitario: 22.9, quantidade: 1, total: 22.9, adicionais: [] },
    ],
  },
];

// ── Sub-componentes ──────────────────────────────────────

const FOP_BADGE: Record<string, { label: string; cor: string; icon: React.ReactNode }> = {
  PIX:            { label: "PIX",     cor: "bg-emerald-500/15 text-emerald-400", icon: <QrCode    size={12}/> },
  DINHEIRO:       { label: "Dinheiro",cor: "bg-blue-500/15 text-blue-400",       icon: <Banknote  size={12}/> },
  CARTAO_DEBITO:  { label: "Débito",  cor: "bg-purple-500/15 text-purple-400",   icon: <CreditCard size={12}/> },
  CARTAO_CREDITO: { label: "Crédito", cor: "bg-purple-500/15 text-purple-400",   icon: <CreditCard size={12}/> },
};

function Timer({ criadoEm, status }: { criadoEm: string; status: StatusPedido }) {
  const [min, setMin] = useState(() =>
    Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60000)
  );
  useEffect(() => {
    const id = setInterval(() =>
      setMin(Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60000)), 60000);
    return () => clearInterval(id);
  }, [criadoEm]);

  if (status === "ENTREGUE" || status === "CANCELADO")
    return <span className="text-xs text-gray-600">{min}min</span>;

  const cor = min > 30 ? "text-red-400 font-semibold" : min > 15 ? "text-amber-400" : "text-gray-400";
  return <span className={`text-xs ${cor}`}>{min}min</span>;
}

const COLUNAS: { status: StatusPedido; label: string; cor: string }[] = [
  { status: "AGUARDANDO", label: "Aguardando", cor: "border-t-blue-500"    },
  { status: "EM_PREPARO", label: "Em Preparo", cor: "border-t-amber-500"   },
  { status: "PRONTO",     label: "Pronto",     cor: "border-t-emerald-500" },
  { status: "ENTREGUE",   label: "Entregue",   cor: "border-t-gray-500"    },
  { status: "CANCELADO",  label: "Cancelado",  cor: "border-t-red-500"     },
];

const PROXIMOS: Partial<Record<StatusPedido, StatusPedido>> = {
  AGUARDANDO: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
  PRONTO:     "ENTREGUE",
};

// ── Página principal ─────────────────────────────────────

export default function PreviewPedidos() {
  const [pedidos, setPedidos] = useState<PedidoDTO[]>(MOCK_PEDIDOS);

  function avancar(id: string, novoStatus: StatusPedido) {
    setPedidos((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: novoStatus } : p)
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Barra */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pedidos.length} pedidos hoje</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 min-h-[44px] text-gray-400
                             hover:text-white hover:bg-dark-700 rounded-lg transition-colors text-sm">
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="flex items-center gap-1.5 px-4 min-h-[44px] bg-brand-500
                             hover:bg-brand-600 text-white font-semibold rounded-xl
                             transition-colors text-sm">
            <Plus size={15} /> Novo pedido
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-x-auto pb-2">
        {COLUNAS.map(({ status, label, cor }) => {
          const cards = pedidos.filter((p) => p.status === status);
          return (
            <section key={status}
              className={`flex flex-col w-72 shrink-0 bg-dark-800 border border-dark-600
                          border-t-2 ${cor} rounded-xl overflow-hidden`}>
              <header className="flex items-center justify-between px-3 py-2.5 border-b border-dark-600">
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className="text-xs bg-dark-700 text-gray-400 font-mono px-1.5 py-0.5 rounded">
                  {cards.length}
                </span>
              </header>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.length === 0 && (
                  <p className="text-xs text-gray-600 text-center mt-6">Nenhum pedido</p>
                )}
                {cards.map((p) => {
                  const fop   = FOP_BADGE[p.forma_pagamento];
                  const prox  = PROXIMOS[p.status];

                  return (
                    <article key={p.id}
                      className="bg-dark-700 border border-dark-600 rounded-xl p-3
                                 hover:border-dark-500 transition-colors">

                      {/* Número + FOP */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl font-black text-white leading-none">
                          #{p.numero_pedido}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full
                                         text-xs font-bold ${fop.cor}`}>
                          {fop.icon} {fop.label}
                        </span>
                      </div>

                      {/* Cliente */}
                      <p className="text-sm text-gray-300 truncate mb-2">
                        {p.cliente?.nome ?? "Cliente balcão"}
                      </p>

                      {/* Itens + adicionais */}
                      <div className="space-y-1 mb-3">
                        {p.itens.map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="text-gray-400">
                              {item.quantidade}× {item.produto_nome}
                            </span>
                            {item.adicionais.map((ad) => (
                              <span key={ad.id}
                                className={`block pl-3 font-bold ${
                                  ad.tipo === "ADICIONAL" ? "text-brand-400" : "text-red-400"
                                }`}>
                                {ad.tipo === "ADICIONAL" ? "+" : "−"} {ad.nome}
                              </span>
                            ))}
                          </div>
                        ))}
                        {p.observacao && (
                          <p className="text-xs text-amber-400 font-medium mt-1">
                            ⚠ {p.observacao}
                          </p>
                        )}
                      </div>

                      {/* Timer + Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-dark-600">
                        <Timer criadoEm={p.criado_em} status={p.status} />
                        <span className="text-sm font-bold text-white">
                          R$ {Number(p.total).toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {/* Ações */}
                      {p.status !== "ENTREGUE" && p.status !== "CANCELADO" && (
                        <div className="flex gap-2 mt-2">
                          {prox && (
                            <button onClick={() => avancar(p.id, prox)}
                              className="flex-1 flex items-center justify-center gap-1
                                         min-h-[44px] bg-brand-500 hover:bg-brand-600
                                         text-white text-xs font-semibold rounded-lg
                                         transition-colors">
                              <ChevronRight size={14} />
                              {prox.replace("_", " ")}
                            </button>
                          )}
                          <button onClick={() => avancar(p.id, "CANCELADO")}
                            className="flex items-center justify-center min-h-[44px] min-w-[44px]
                                       bg-red-500/15 hover:bg-red-500/25 text-red-400
                                       rounded-lg transition-colors"
                            title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
