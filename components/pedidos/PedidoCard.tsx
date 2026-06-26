"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Banknote, CreditCard, QrCode, Clock, ChevronRight, X,
} from "lucide-react";
import type { PedidoDTO, FormaPagamento, StatusPedido } from "@/types";
import { atualizarStatus } from "@/hooks/usePedidos";

// ── Helpers ──────────────────────────────────────────────

function minutosDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function timerClasse(minutos: number, status: StatusPedido) {
  if (status === "ENTREGUE" || status === "CANCELADO") return "text-gray-500";
  if (minutos > 30) return "text-red-400 font-semibold";
  if (minutos > 15) return "text-amber-400";
  return "text-gray-400";
}

function formatarMinutos(min: number) {
  if (min < 60) return `${min}min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

const FOP_ICON: Record<FormaPagamento, React.ReactNode> = {
  DINHEIRO:       <Banknote  size={14} />,
  CARTAO_DEBITO:  <CreditCard size={14} />,
  CARTAO_CREDITO: <CreditCard size={14} />,
  PIX:            <QrCode    size={14} />,
  FIADO:          <Clock     size={14} />,
};

const FOP_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO:       "Dinheiro",
  CARTAO_DEBITO:  "Débito",
  CARTAO_CREDITO: "Crédito",
  PIX:            "PIX",
  FIADO:          "Fiado",
};

const PROXIMOS: Partial<Record<StatusPedido, StatusPedido>> = {
  AGUARDANDO: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
  PRONTO:     "ENTREGUE",
};

// ── Componente ───────────────────────────────────────────

interface Props {
  pedido:  PedidoDTO;
  onMutate: () => void;
}

export function PedidoCard({ pedido, onMutate }: Props) {
  const [minutos, setMinutos]     = useState(() => minutosDesde(pedido.criado_em));
  const [loading, setLoading]     = useState<StatusPedido | null>(null);
  const [erro,    setErro]        = useState<string | null>(null);

  // Atualiza o timer a cada minuto
  useEffect(() => {
    const id = setInterval(() => setMinutos(minutosDesde(pedido.criado_em)), 60_000);
    return () => clearInterval(id);
  }, [pedido.criado_em]);

  const avancar = useCallback(async (status: StatusPedido) => {
    setLoading(status);
    setErro(null);
    try {
      await atualizarStatus(pedido.id, status);
      onMutate();
    } catch {
      setErro("Falha ao atualizar pedido. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }, [pedido.id, onMutate]);

  const proximo = PROXIMOS[pedido.status];

  return (
    <article className="bg-dark-700 border border-dark-600 rounded-xl p-3
                        hover:border-dark-500 transition-colors">

      {/* Linha 1: número + FOP */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl font-black text-white leading-none">
          #{pedido.numero_pedido}
        </span>
        <span className={`
          flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
          ${pedido.forma_pagamento === "PIX"
            ? "bg-emerald-500/15 text-emerald-400"
            : pedido.forma_pagamento === "DINHEIRO"
            ? "bg-blue-500/15 text-blue-400"
            : "bg-purple-500/15 text-purple-400"}
        `}>
          {FOP_ICON[pedido.forma_pagamento]}
          {FOP_LABEL[pedido.forma_pagamento]}
        </span>
      </div>

      {/* Linha 2: cliente */}
      <p className="text-sm text-gray-300 truncate mb-2">
        {pedido.cliente?.nome ?? "Cliente balcão"}
      </p>

      {/* Itens com adicionais em negrito */}
      <div className="space-y-1 mb-3">
        {pedido.itens.map((item) => (
          <div key={item.id} className="text-xs">
            <span className="text-gray-400">
              {item.quantidade}× {item.produto_nome}
            </span>
            {item.adicionais.length > 0 && (
              <div className="pl-3 mt-0.5 space-y-0.5">
                {item.adicionais.map((ad) => (
                  <span
                    key={ad.id}
                    className={`block font-bold ${
                      ad.tipo === "ADICIONAL" ? "text-brand-400" : "text-red-400"
                    }`}
                  >
                    {ad.tipo === "ADICIONAL" ? "+" : "−"} {ad.nome}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {pedido.observacao && (
          <p className="text-xs text-amber-400 font-medium mt-1">
            ⚠ {pedido.observacao}
          </p>
        )}
      </div>

      {/* Rodapé: timer + total */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-600">
        <span className={`text-xs ${timerClasse(minutos, pedido.status)}`}>
          {formatarMinutos(minutos)}
        </span>
        <span className="text-sm font-bold text-white">
          R$ {Number(pedido.total).toFixed(2).replace(".", ",")}
        </span>
      </div>

      {/* Erro de atualização */}
      {erro && (
        <p className="text-xs text-red-400 mt-2 text-center">{erro}</p>
      )}

      {/* Ações */}
      {(proximo || pedido.status === "AGUARDANDO" || pedido.status === "EM_PREPARO" || pedido.status === "PRONTO") && (
        <div className="flex gap-2 mt-2">
          {proximo && (
            <button
              onClick={() => avancar(proximo)}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-1
                         min-h-[44px] bg-brand-500 hover:bg-brand-600
                         text-white text-xs font-semibold rounded-lg
                         transition-colors disabled:opacity-50"
            >
              {loading === proximo
                ? "…"
                : <><ChevronRight size={14} /> {proximo.replace("_", " ")}</>}
            </button>
          )}
          {pedido.status !== "CANCELADO" && pedido.status !== "ENTREGUE" && (
            <button
              onClick={() => avancar("CANCELADO")}
              disabled={!!loading}
              className="flex items-center justify-center min-h-[44px] min-w-[44px]
                         bg-red-500/15 hover:bg-red-500/25 text-red-400
                         rounded-lg transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              {loading === "CANCELADO" ? "…" : <X size={14} />}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
