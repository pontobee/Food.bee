"use client";

import { QrCode, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

// Placeholder da integração com Evolution API.
// A lógica de QR Code e status de conexão virá do container Evolution API no Railway.

export default function WhatsAppPage() {
  const [conectado] = useState(false); // virá de /api/whatsapp/status

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Integração via Evolution API
        </p>
      </div>

      {/* Status de conexão */}
      <div className="card p-5 flex items-center gap-4">
        {conectado ? (
          <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
        ) : (
          <XCircle size={22} className="text-red-400 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-white">
            {conectado ? "Conectado" : "Desconectado"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {conectado
              ? "Seu WhatsApp está ativo e recebendo mensagens."
              : "Escaneie o QR Code abaixo para conectar."}
          </p>
        </div>
      </div>

      {/* QR Code placeholder */}
      {!conectado && (
        <div className="card p-8 flex flex-col items-center gap-4">
          <QrCode size={80} className="text-gray-600" />
          <p className="text-sm text-gray-500 text-center max-w-xs">
            O QR Code será exibido aqui após configurar a URL da Evolution API
            nas configurações.
          </p>
          <button className="btn-primary">
            Gerar QR Code
          </button>
        </div>
      )}

      {/* Histórico de mensagens */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-brand-400" />
          <h2 className="font-semibold text-white text-sm">Histórico de mensagens</h2>
        </div>
        <p className="text-sm text-gray-600">
          Mensagens automáticas aparecerão aqui após a conexão.
        </p>
      </div>
    </div>
  );
}
