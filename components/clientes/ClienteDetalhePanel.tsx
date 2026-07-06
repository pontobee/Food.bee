"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Phone, MapPin, ShoppingBag, DollarSign } from "lucide-react";
import { ClienteModal }    from "./ClienteModal";
import type { ClienteDTO } from "@/types";

interface Pedido {
  id:              string;
  numero_pedido:   number;
  status:          string;
  total:           number;
  forma_pagamento: string;
  criado_em:       string;
}

interface ClienteDetalhe extends ClienteDTO {
  pedidos: Pedido[];
}

interface Props {
  clienteId: string;
  onClose:   () => void;
  onAtualizado: (c: ClienteDTO) => void;
}

const STATUS_COR: Record<string, string> = {
  AGUARDANDO: "bg-yellow-500/15 text-yellow-400",
  EM_PREPARO: "bg-blue-500/15 text-blue-400",
  PRONTO:     "bg-purple-500/15 text-purple-400",
  ENTREGUE:   "bg-emerald-500/15 text-emerald-400",
  CANCELADO:  "bg-red-500/15 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  EM_PREPARO: "Em preparo",
  PRONTO:     "Pronto",
  ENTREGUE:   "Entregue",
  CANCELADO:  "Cancelado",
};

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO:       "Dinheiro",
  PIX:            "Pix",
  CARTAO_DEBITO:  "Débito",
  CARTAO_CREDITO: "Crédito",
};

const fmtBRL  = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function ClienteDetalhePanel({ clienteId, onClose, onAtualizado }: Props) {
  const [data,          setData]          = useState<ClienteDetalhe | null>(null);
  const [carregando,    setCarregando]    = useState(true);
  const [editando,      setEditando]      = useState(false);

  useEffect(() => {
    setCarregando(true);
    fetch(`/api/clientes/${clienteId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setCarregando(false));
  }, [clienteId]);

  function handleAtualizado(c: ClienteDTO) {
    setData((prev) => prev ? { ...prev, ...c } : null);
    setEditando(false);
    onAtualizado(c);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#161616] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-base font-semibold text-white">Detalhes do cliente</h2>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => setEditando(true)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {carregando && (
          <p className="p-5 text-sm text-gray-500">Carregando…</p>
        )}

        {!carregando && data && (
          <div className="flex-1 overflow-y-auto">
            {/* Info do cliente */}
            <div className="p-5 space-y-3 border-b border-white/10">
              <div>
                <p className="text-lg font-semibold text-white">{data.nome}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone size={14} className="shrink-0" />
                  {data.telefone}
                </div>
                {data.endereco && (
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <MapPin size={14} className="shrink-0 mt-0.5" />
                    {data.endereco}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <ShoppingBag size={12} />
                    Pedidos
                  </div>
                  <p className="text-xl font-bold text-white">{data.total_pedidos}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <DollarSign size={12} />
                    Total gasto
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{fmtBRL(data.total_gasto)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">Cliente desde {fmtData(data.criado_em)}</p>
            </div>

            {/* Histórico de pedidos */}
            <div className="p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Últimos pedidos
              </p>
              {data.pedidos.length === 0 ? (
                <p className="text-sm text-gray-600">Nenhum pedido encontrado.</p>
              ) : (
                <div className="space-y-2">
                  {data.pedidos.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">#{p.numero_pedido}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[p.status] ?? ""}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fmtData(p.criado_em)} · {FORMA_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-white">{fmtBRL(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editando && data && (
        <ClienteModal
          cliente={data}
          onClose={() => setEditando(false)}
          onSalvo={handleAtualizado}
        />
      )}
    </>
  );
}
