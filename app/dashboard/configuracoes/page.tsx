"use client";

import { useEffect, useState } from "react";
import { useSession }          from "next-auth/react";
import { Settings, User, Bell, QrCode, Check, Loader2, Bike, Trash2, Plus } from "lucide-react";
import type { TaxaEntregaDTO } from "@/types";

function DeliverySection() {
  const [taxas,    setTaxas]    = useState<TaxaEntregaDTO[]>([]);
  const [nome,     setNome]     = useState("");
  const [taxa,     setTaxa]     = useState("");
  const [tempo,    setTempo]    = useState("");
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    fetch("/api/delivery/taxas").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setTaxas(d);
    });
  }

  useEffect(() => { carregar(); }, []);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !taxa) return;
    setSalvando(true);
    try {
      await fetch("/api/delivery/taxas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nome,
          taxa:      parseFloat(taxa),
          tempo_min: tempo ? parseInt(tempo) : null,
        }),
      });
      setNome(""); setTaxa(""); setTempo("");
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    await fetch(`/api/delivery/taxas/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Bike size={15} className="text-brand-400" />
        <h2 className="font-semibold text-white text-sm">Delivery — Zonas de entrega</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">Cadastre bairros e taxas de entrega.</p>

      {/* Lista de zonas */}
      {taxas.length > 0 && (
        <ul className="space-y-2 mb-4">
          {taxas.map((t) => (
            <li key={t.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-white">{t.nome}</p>
                <p className="text-xs text-gray-500">
                  R$ {Number(t.taxa).toFixed(2).replace(".", ",")}
                  {t.tempo_min ? ` · ~${t.tempo_min}min` : ""}
                </p>
              </div>
              <button
                onClick={() => remover(t.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulário nova zona */}
      <form onSubmit={adicionar} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Bairro / Zona"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="flex-1 h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                       text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-brand-500"
          />
          <input
            type="number"
            placeholder="Taxa R$"
            value={taxa}
            min="0"
            step="0.01"
            onChange={(e) => setTaxa(e.target.value)}
            className="w-24 h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                       text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-brand-500"
          />
          <input
            type="number"
            placeholder="Min"
            value={tempo}
            min="1"
            onChange={(e) => setTempo(e.target.value)}
            className="w-16 h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                       text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={salvando || !nome.trim() || !taxa}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Adicionar zona
        </button>
      </form>
    </div>
  );
}

function PixConfigSection() {
  const [token,     setToken]     = useState("");
  const [hint,      setHint]      = useState<string | null>(null);
  const [configurado, setConfigurado] = useState(false);
  const [salvando,  setSalvando]  = useState(false);
  const [salvo,     setSalvo]     = useState(false);

  useEffect(() => {
    fetch("/api/configuracoes/pix")
      .then((r) => r.json())
      .then((d) => {
        setConfigurado(d.configurado ?? false);
        setHint(d.access_token_hint ?? null);
      });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setSalvando(true);
    try {
      await fetch("/api/configuracoes/pix", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ access_token: token }),
      });
      setSalvo(true);
      setConfigurado(true);
      setHint("…" + token.slice(-6));
      setToken("");
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <QrCode size={15} className="text-brand-400" />
        <h2 className="font-semibold text-white text-sm">Pix Automático</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Integração com Mercado Pago para confirmar pagamentos automaticamente.
      </p>

      {configurado && hint && (
        <div className="flex items-center gap-2 mb-4 text-xs text-emerald-400">
          <Check size={13} />
          Configurado — token termina em <code className="font-mono">{hint}</code>
        </div>
      )}

      <form onSubmit={salvar} className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Access Token do Mercado Pago
          </label>
          <input
            type="password"
            placeholder={configurado ? "Novo token (deixe vazio para manter)" : "APP_USR-... ou TEST-..."}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5
                       text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-brand-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            Encontre em{" "}
            <span className="text-gray-400">mercadopago.com → Seu negócio → Credenciais</span>
          </p>
        </div>
        <button
          type="submit"
          disabled={salvando || !token.trim()}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {salvando
            ? <Loader2 size={14} className="animate-spin" />
            : salvo
            ? <Check size={14} />
            : null}
          {salvo ? "Salvo!" : "Salvar token"}
        </button>
      </form>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preferências do sistema</p>
      </div>

      {/* Perfil */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-brand-400" />
          <h2 className="font-semibold text-white text-sm">Meu perfil</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Nome</p>
            <p className="text-sm text-white">{session?.user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">E-mail</p>
            <p className="text-sm text-white">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Perfil de acesso</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              role === "ADMIN"
                ? "bg-brand-500/15 text-brand-400"
                : "bg-blue-500/15 text-blue-400"
            }`}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Lanchonete — somente ADMIN */}
      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={15} className="text-brand-400" />
            <h2 className="font-semibold text-white text-sm">Lanchonete</h2>
          </div>
          <p className="text-sm text-gray-500">
            Edição dos dados da lanchonete estará disponível em breve.
          </p>
        </div>
      )}

      {/* Delivery — somente ADMIN */}
      {role === "ADMIN" && <DeliverySection />}

      {/* Pix Automático — somente ADMIN */}
      {role === "ADMIN" && <PixConfigSection />}

      {/* Assinatura */}
      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={15} className="text-brand-400" />
            <h2 className="font-semibold text-white text-sm">Assinatura</h2>
          </div>
          <p className="text-sm text-gray-500">
            Status: <span className="text-emerald-400 font-medium">
              {session?.user?.assinatura_status}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
