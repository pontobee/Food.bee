"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  QrCode, CheckCircle2, XCircle, AlertCircle,
  Loader2, Settings, RefreshCw, LogOut,
} from "lucide-react";

type Estado = "loading" | "not_configured" | "disconnected" | "connecting" | "connected" | "error";

interface Config { evolution_url: string; instance_nome: string }

function badge(estado: Estado) {
  if (estado === "connected")
    return <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 size={15} /> Conectado</span>;
  if (estado === "disconnected" || estado === "connecting")
    return <span className="flex items-center gap-1.5 text-sm text-yellow-400"><AlertCircle size={15} /> Desconectado</span>;
  if (estado === "error")
    return <span className="flex items-center gap-1.5 text-sm text-red-400"><XCircle size={15} /> Erro de conexão</span>;
  if (estado === "not_configured")
    return <span className="flex items-center gap-1.5 text-sm text-gray-500"><Settings size={15} /> Não configurado</span>;
  return <span className="flex items-center gap-1.5 text-sm text-gray-500"><Loader2 size={15} className="animate-spin" /> Verificando…</span>;
}

export default function WhatsAppPage() {
  const [estado,    setEstado]    = useState<Estado>("loading");
  const [config,    setConfig]    = useState<Config | null>(null);
  const [qrcode,    setQrcode]    = useState<string | null>(null);
  const [salvando,  setSalvando]  = useState(false);
  const [form,      setForm]      = useState({ evolution_url: "", evolution_api_key: "", instance_nome: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);
  const poolRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function carregarStatus() {
    const res  = await fetch("/api/whatsapp/status");
    const data = await res.json() as { state: string };
    const mapa: Record<string, Estado> = {
      open:           "connected",
      connecting:     "connecting",
      close:          "disconnected",
      not_configured: "not_configured",
      error:          "error",
    };
    setEstado(mapa[data.state] ?? "disconnected");
    return data.state;
  }

  async function carregarConfig() {
    const res  = await fetch("/api/whatsapp/config");
    const data = await res.json() as Config | null;
    setConfig(data);
    if (data) setForm((f) => ({ ...f, evolution_url: data.evolution_url, instance_nome: data.instance_nome }));
  }

  async function gerarQrCode() {
    setQrcode(null);
    setEstado("connecting");
    const res  = await fetch("/api/whatsapp/qrcode");
    const data = await res.json() as { qrcode?: { base64?: string }; error?: string };
    if (data.qrcode?.base64) {
      setQrcode(data.qrcode.base64);
      iniciarPolling();
    } else {
      setEstado("error");
    }
  }

  function iniciarPolling() {
    if (poolRef.current) clearInterval(poolRef.current);
    poolRef.current = setInterval(async () => {
      const state = await carregarStatus();
      if (state === "open") {
        clearInterval(poolRef.current!);
        setQrcode(null);
      }
    }, 5000);
  }

  async function salvarConfig(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setErro(d.error ?? "Erro ao salvar");
      } else {
        await carregarConfig();
        await carregarStatus();
        setMostrarForm(false);
      }
    } finally {
      setSalvando(false);
    }
  }

  async function desconectar() {
    await fetch("/api/whatsapp/desconectar", { method: "POST" });
    setQrcode(null);
    carregarStatus();
  }

  useEffect(() => {
    carregarConfig();
    carregarStatus();
    return () => { if (poolRef.current) clearInterval(poolRef.current); };
  }, []);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-0.5">Integração via Evolution API</p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <Settings size={14} />
          Configurar
        </button>
      </div>

      {/* Formulário de configuração */}
      {mostrarForm && (
        <form onSubmit={salvarConfig} className="card p-5 space-y-3">
          <h2 className="font-semibold text-white text-sm">Configurações da Evolution API</h2>

          <div>
            <label className="label">URL da Evolution API</label>
            <input
              className="input"
              placeholder="https://evolution.meusite.com"
              value={form.evolution_url}
              onChange={(e) => setForm((f) => ({ ...f, evolution_url: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">API Key</label>
            <input
              className="input"
              type="password"
              placeholder="Chave global da Evolution API"
              value={form.evolution_api_key}
              onChange={(e) => setForm((f) => ({ ...f, evolution_api_key: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Nome da instância</label>
            <input
              className="input"
              placeholder="lanchesmart"
              value={form.instance_nome}
              onChange={(e) => setForm((f) => ({ ...f, instance_nome: e.target.value }))}
              required
            />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Status */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm mb-1">Status da conexão</p>
          {badge(estado)}
          {config && (
            <p className="text-xs text-gray-600 mt-1">{config.instance_nome} · {config.evolution_url}</p>
          )}
        </div>
        {estado === "connected" && (
          <button onClick={desconectar} className="btn-ghost text-sm flex items-center gap-1.5 text-red-400 hover:text-red-300">
            <LogOut size={14} /> Desconectar
          </button>
        )}
        {estado !== "connected" && estado !== "loading" && estado !== "not_configured" && (
          <button onClick={carregarStatus} className="btn-ghost text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> Atualizar
          </button>
        )}
      </div>

      {/* QR Code */}
      {estado !== "connected" && estado !== "not_configured" && config && (
        <div className="card p-8 flex flex-col items-center gap-4">
          {qrcode ? (
            <>
              <Image
                src={qrcode.startsWith("data:") ? qrcode : `data:image/png;base64,${qrcode}`}
                alt="QR Code WhatsApp"
                width={220}
                height={220}
                className="rounded-lg"
                unoptimized
              />
              <p className="text-sm text-gray-400 text-center">
                Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
              </p>
              <p className="text-xs text-gray-600">Verificando conexão automaticamente…</p>
            </>
          ) : (
            <>
              <QrCode size={64} className="text-gray-600" />
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Clique em <strong>Gerar QR Code</strong> para conectar seu número de WhatsApp.
              </p>
              <button className="btn-primary" onClick={gerarQrCode}>
                Gerar QR Code
              </button>
            </>
          )}
        </div>
      )}

      {/* Sem configuração */}
      {estado === "not_configured" && (
        <div className="card p-6 text-center">
          <Settings size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">
            Configure a URL e a chave da Evolution API para começar.
          </p>
          <button className="btn-primary" onClick={() => setMostrarForm(true)}>
            Configurar agora
          </button>
        </div>
      )}
    </div>
  );
}
