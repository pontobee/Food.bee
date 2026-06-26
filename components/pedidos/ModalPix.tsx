"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  pedidoId:     string;
  numeroPedido: number;
  onClose:      () => void;
}

interface PixData {
  pago:       boolean;
  pix_qrcode: string | null;
  error?:     string;
}

export function ModalPix({ pedidoId, numeroPedido, onClose }: Props) {
  const [data,     setData]     = useState<PixData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [copiado,  setCopiado]  = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/pix`);
      const json = await res.json();
      setData(res.ok ? json : { pago: false, pix_qrcode: null, error: json.error });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [pedidoId]);

  // Polling de confirmação enquanto aguarda pagamento
  useEffect(() => {
    if (!data || data.pago || data.error) return;
    const id = setInterval(carregar, 10_000);
    return () => clearInterval(id);
  }, [data?.pago, data?.error]);

  async function copiar() {
    if (!data?.pix_qrcode) return;
    await navigator.clipboard.writeText(data.pix_qrcode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-bold text-white">Pix — Pedido #{numeroPedido}</p>
            <p className="text-xs text-gray-500 mt-0.5">Escaneie ou copie o código</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        {loading && (
          <div className="flex flex-col items-center py-10 gap-3">
            <RefreshCw size={24} className="text-gray-500 animate-spin" />
            <p className="text-sm text-gray-500">Gerando QR Code…</p>
          </div>
        )}

        {!loading && data?.error && (
          <div className="text-center py-6">
            <p className="text-sm text-red-400 mb-3">{data.error}</p>
            <p className="text-xs text-gray-500">
              Configure o Mercado Pago em{" "}
              <strong className="text-white">Configurações → Pix</strong>
            </p>
          </div>
        )}

        {!loading && data?.pago && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-emerald-400" />
            </div>
            <p className="font-bold text-white">Pagamento confirmado!</p>
            <p className="text-xs text-gray-500 mt-1">O Pix foi recebido com sucesso.</p>
          </div>
        )}

        {!loading && !data?.pago && data?.pix_qrcode && (
          <>
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={data.pix_qrcode} size={180} />
              </div>
            </div>

            {/* Status aguardando */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400">Aguardando pagamento…</span>
            </div>

            {/* Copia e cola */}
            <div className="bg-dark-700 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Pix copia e cola</p>
              <p className="text-xs text-gray-300 break-all line-clamp-2 font-mono">
                {data.pix_qrcode}
              </p>
            </div>

            <button
              onClick={copiar}
              className="w-full flex items-center justify-center gap-2 border border-dark-500 hover:border-brand-500 text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiado ? "Copiado!" : "Copiar código"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
