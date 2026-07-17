"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Banknote, CreditCard, QrCode, ChevronRight, X, CheckCircle2, Bike, AlertTriangle, Printer,
} from "lucide-react";
import type { PedidoDTO, FormaPagamento, StatusPedido } from "@/types";
import { TicketComanda, type PedidoParaImpressao } from "@/components/pedidos/TicketComanda";
import { atualizarStatus }  from "@/hooks/usePedidos";
import { ModalPix }         from "@/components/pedidos/ModalPix";

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
};

const FOP_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO:       "Dinheiro",
  CARTAO_DEBITO:  "Débito",
  CARTAO_CREDITO: "Crédito",
  PIX:            "PIX",
};

const PROXIMOS: Partial<Record<StatusPedido, StatusPedido>> = {
  AGUARDANDO: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
  PRONTO:     "ENTREGUE",
};

// ── Helpers de impressão ──────────────────────────────────

function toPedidoParaImpressao(p: PedidoDTO): PedidoParaImpressao {
  return {
    id:       String(p.numero_pedido),
    cliente:  p.cliente?.nome ?? "Cliente balcão",
    telefone: p.cliente?.telefone,
    tipo:     p.tipo_entrega === "DELIVERY" ? "DELIVERY" : "RETIRADA",
    endereco: p.tipo_entrega === "DELIVERY" && p.endereco_entrega
      ? { rua: p.endereco_entrega, bairro: "", cidade: "" }
      : undefined,
    itens: p.itens.map((item) => ({
      quantidade: item.quantidade,
      nome:       item.produto_nome,
      adicionais: item.adicionais.filter((a) => a.tipo === "ADICIONAL").map((a) => a.nome),
      remocoes:   item.adicionais.filter((a) => a.tipo === "EXCECAO").map((a) => a.nome),
    })),
    data:            new Date(p.criado_em),
    fop:             FOP_LABEL[p.forma_pagamento],
    statusPagamento: p.pago_em ? "PAGO" : "PENDENTE",
    subtotal:        Number(p.subtotal),
    taxaEntrega:     p.taxa_entrega != null ? Number(p.taxa_entrega) : undefined,
    total:           Number(p.total),
    trocoPara:       p.troco != null ? Number(p.troco) : undefined,
  };
}

function PrintModal({ pedido, onClose }: { pedido: PedidoParaImpressao; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl shadow-xl overflow-hidden max-w-xs w-full">
        <div className="flex items-center justify-between px-4 py-3 no-print border-b border-dark-600">
          <h2 className="font-semibold text-white text-sm">Comanda #{pedido.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <TicketComanda pedido={pedido} />
        <div className="flex gap-2 p-4 no-print border-t border-dark-600">
          <button onClick={() => window.print()} className="flex-1 btn-primary text-sm">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose} className="btn-ghost text-sm px-4">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de cancelamento ─────────────────────────────────

interface CancelModalProps {
  onConfirmar: (motivo: string) => void;
  onFechar:    () => void;
  loading:     boolean;
}

function CancelModal({ onConfirmar, onFechar, loading }: CancelModalProps) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <h2 className="font-semibold text-white text-sm">Cancelar pedido</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Informe o motivo do cancelamento.</p>
        <textarea
          className="input resize-none text-sm w-full"
          rows={3}
          placeholder="Ex: cliente desistiu, item indisponível…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { if (motivo.trim()) onConfirmar(motivo.trim()); }}
            disabled={!motivo.trim() || loading}
            className="flex-1 btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "Cancelando…" : "Confirmar cancelamento"}
          </button>
          <button onClick={onFechar} className="btn-ghost text-sm px-4">
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente ───────────────────────────────────────────

interface Props {
  pedido:  PedidoDTO;
  onMutate: () => void;
}

export function PedidoCard({ pedido, onMutate }: Props) {
  const [minutos,      setMinutos]      = useState(() => minutosDesde(pedido.criado_em));
  const [loading,      setLoading]      = useState<StatusPedido | null>(null);
  const [erro,         setErro]         = useState<string | null>(null);
  const [pixAberto,    setPixAberto]    = useState(false);
  const [cancelModal,  setCancelModal]  = useState(false);
  const [printOpen,    setPrintOpen]    = useState(false);

  useEffect(() => {
    const id = setInterval(() => setMinutos(minutosDesde(pedido.criado_em)), 60_000);
    return () => clearInterval(id);
  }, [pedido.criado_em]);

  const avancar = useCallback(async (status: StatusPedido, motivo_cancelamento?: string) => {
    setLoading(status);
    setErro(null);
    try {
      await atualizarStatus(pedido.id, status, motivo_cancelamento);
      onMutate();
    } catch {
      setErro("Falha ao atualizar pedido. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }, [pedido.id, onMutate]);

  const confirmarCancelamento = useCallback(async (motivo: string) => {
    await avancar("CANCELADO", motivo);
    setCancelModal(false);
  }, [avancar]);

  const proximo = PROXIMOS[pedido.status];

  return (
    <>
      <article className="bg-gradient-dark-card border border-dark-600/80 rounded-2xl p-3.5
                          hover:border-dark-500/70 hover:shadow-card-lg transition-all duration-200">

        {/* Linha 1: número + FOP */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-black text-white leading-none">
            #{pedido.numero_pedido}
          </span>
          <div className="flex items-center gap-1.5">
            {pedido.pago_em && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 size={12} />
                Pago
              </span>
            )}
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
        </div>

        {/* Linha 2: cliente + badge delivery */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-gray-300 truncate flex-1">
            {pedido.cliente?.nome ?? "Cliente balcão"}
          </p>
          {pedido.tipo_entrega === "DELIVERY" && (
            <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              <Bike size={11} /> Delivery
            </span>
          )}
        </div>

        {/* Endereço de entrega */}
        {pedido.tipo_entrega === "DELIVERY" && pedido.endereco_entrega && (
          <p className="text-xs text-amber-300/70 mb-2 leading-snug">
            📍 {pedido.endereco_entrega}
          </p>
        )}

        {/* Itens com adicionais */}
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

        {/* Motivo de cancelamento */}
        {pedido.status === "CANCELADO" && pedido.motivo_cancelamento && (
          <p className="text-xs text-red-400/80 bg-red-500/10 rounded-lg px-2 py-1.5 mb-3 leading-snug">
            Cancelado: {pedido.motivo_cancelamento}
          </p>
        )}

        {/* Rodapé: timer + imprimir + total */}
        <div className="flex items-center justify-between pt-2.5 border-t border-dark-600/60">
          <span className={`text-xs ${timerClasse(minutos, pedido.status)}`}>
            {formatarMinutos(minutos)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintOpen(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Imprimir comanda"
            >
              <Printer size={13} />
            </button>
            <span className="text-sm font-bold text-white">
              R$ {Number(pedido.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Ações */}
        {(proximo || pedido.status === "AGUARDANDO" || pedido.status === "EM_PREPARO" || pedido.status === "PRONTO") && (
          <div className="flex gap-2 mt-2">
            {pedido.forma_pagamento === "PIX" &&
             !pedido.pago_em &&
             pedido.status !== "CANCELADO" &&
             pedido.status !== "ENTREGUE" && (
              <button
                onClick={() => setPixAberto(true)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px]
                           bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400
                           rounded-lg transition-colors"
                title="Ver QR Code Pix"
              >
                <QrCode size={14} />
              </button>
            )}

            {proximo && (
              <button
                onClick={() => avancar(proximo)}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-1
                           min-h-[44px] bg-gradient-brand hover:brightness-105
                           text-white text-xs font-semibold rounded-xl
                           shadow-glow-sm hover:shadow-glow
                           transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                {loading === proximo
                  ? "…"
                  : <><ChevronRight size={14} /> {proximo.replace("_", " ")}</>}
              </button>
            )}

            {pedido.status !== "CANCELADO" && pedido.status !== "ENTREGUE" && (
              <button
                onClick={() => setCancelModal(true)}
                disabled={!!loading}
                className="flex items-center justify-center min-h-[44px] min-w-[44px]
                           bg-red-500/15 hover:bg-red-500/25 text-red-400
                           rounded-lg transition-colors disabled:opacity-50"
                title="Cancelar pedido"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {erro && (
          <p className="text-xs text-red-400 mt-2 text-center">{erro}</p>
        )}
      </article>

      {pixAberto && (
        <ModalPix
          pedidoId={pedido.id}
          numeroPedido={pedido.numero_pedido}
          onClose={() => { setPixAberto(false); onMutate(); }}
        />
      )}

      {cancelModal && (
        <CancelModal
          onConfirmar={confirmarCancelamento}
          onFechar={() => setCancelModal(false)}
          loading={loading === "CANCELADO"}
        />
      )}

      {printOpen && (
        <PrintModal
          pedido={toPedidoParaImpressao(pedido)}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </>
  );
}
