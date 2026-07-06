"use client";

import { useEffect, useRef, useState } from "react";
import { useSession }                  from "next-auth/react";
import Image                           from "next/image";
import { Settings, User, Bell, QrCode, Check, Loader2, Bike, Trash2, Plus, Upload, Clock, Store } from "lucide-react";
import type { TaxaEntregaDTO } from "@/types";

// ─── Tipos de horários ───────────────────────────────────────────────────────
interface HorarioDia { aberto: boolean; abertura: string; fechamento: string }
type Horarios = Record<string, HorarioDia>; // "0"=Dom … "6"=Sáb

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function horariosDefault(): Horarios {
  return Object.fromEntries(
    DIAS.map((_, i) => [String(i), { aberto: i >= 1 && i <= 6, abertura: "10:00", fechamento: "22:00" }])
  );
}

// ─── Seção: Informações da lanchonete ────────────────────────────────────────
function InfoLanchoneteSection() {
  const [nome,     setNome]     = useState("");
  const [cnpj,     setCnpj]     = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo,    setSalvo]    = useState(false);

  useEffect(() => {
    fetch("/api/configuracoes/lanchonete")
      .then((r) => r.json())
      .then((d) => {
        setNome(d.nome ?? "");
        setCnpj(d.cnpj ?? "");
        setTelefone(d.telefone ?? "");
        setEndereco(d.endereco ?? "");
      });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await fetch("/api/configuracoes/lanchonete", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome, cnpj: cnpj || null, telefone: telefone || null, endereco: endereco || null }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Store size={15} className="text-brand-400" />
        <h2 className="font-semibold text-white text-sm">Informações do estabelecimento</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">Dados exibidos no cardápio digital.</p>

      <form onSubmit={salvar} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                         text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                         text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                         text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full h-9 bg-dark-700 border border-dark-500 rounded-lg px-3
                         text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando || !nome.trim()}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : salvo ? <Check size={14} /> : null}
          {salvo ? "Salvo!" : "Salvar informações"}
        </button>
      </form>
    </div>
  );
}

// ─── Seção: Horários de funcionamento ────────────────────────────────────────
function HorariosSection() {
  const [horarios, setHorarios] = useState<Horarios>(horariosDefault());
  const [salvando, setSalvando] = useState(false);
  const [salvo,    setSalvo]    = useState(false);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    fetch("/api/configuracoes/lanchonete")
      .then((r) => r.json())
      .then((d) => {
        if (d.horarios && typeof d.horarios === "object") {
          setHorarios(d.horarios as Horarios);
        }
        setCarregou(true);
      });
  }, []);

  function atualizar(dia: string, campo: keyof HorarioDia, valor: string | boolean) {
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch("/api/configuracoes/lanchonete", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ horarios }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  }

  if (!carregou) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={15} className="text-brand-400" />
        <h2 className="font-semibold text-white text-sm">Horários de funcionamento</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Pedidos fora do horário serão bloqueados no cardápio digital.
      </p>

      <form onSubmit={salvar} className="space-y-2">
        {DIAS.map((dia, i) => {
          const h = horarios[String(i)] ?? { aberto: false, abertura: "10:00", fechamento: "22:00" };
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-8 text-xs font-semibold text-gray-400">{dia}</span>

              <button
                type="button"
                onClick={() => atualizar(String(i), "aberto", !h.aberto)}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${h.aberto ? "bg-brand-500" : "bg-dark-600"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${h.aberto ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>

              {h.aberto ? (
                <>
                  <input
                    type="time"
                    value={h.abertura}
                    onChange={(e) => atualizar(String(i), "abertura", e.target.value)}
                    className="h-8 w-28 bg-dark-700 border border-dark-600 rounded-lg px-2
                               text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                  <span className="text-gray-600 text-xs">até</span>
                  <input
                    type="time"
                    value={h.fechamento}
                    onChange={(e) => atualizar(String(i), "fechamento", e.target.value)}
                    className="h-8 w-28 bg-dark-700 border border-dark-600 rounded-lg px-2
                               text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </>
              ) : (
                <span className="text-xs text-gray-600">Fechado</span>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : salvo ? <Check size={14} /> : null}
            {salvo ? "Salvo!" : "Salvar horários"}
          </button>
        </div>
      </form>
    </div>
  );
}

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

function LogoSection() {
  const [logoUrl,   setLogoUrl]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [salvo,     setSalvo]     = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/configuracoes/logo")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.logo_url) setLogoUrl(d.logo_url); });
  }, []);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      const res  = await fetch("/api/configuracoes/logo", { method: "POST", body: form });
      const data = await res.json();
      if (data.logo_url) { setLogoUrl(data.logo_url); setSalvo(true); setTimeout(() => setSalvo(false), 2500); }
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const exibida = preview ?? logoUrl;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={15} className="text-brand-400" />
        <h2 className="font-semibold text-white text-sm">Lanchonete</h2>
      </div>

      <p className="text-xs text-gray-500 mb-4">Logo exibida no cardápio público.</p>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-20 h-20 rounded-xl bg-dark-700 border border-dark-500 flex items-center justify-center overflow-hidden shrink-0">
          {exibida ? (
            <Image src={exibida} alt="Logo" width={80} height={80} className="object-cover w-full h-full" unoptimized={!!preview} />
          ) : (
            <Upload size={22} className="text-gray-600" />
          )}
        </div>

        {/* Drop zone / botão */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex-1 border-2 border-dashed border-dark-500 rounded-xl p-4 text-center cursor-pointer hover:border-brand-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-brand-400 mx-auto" />
          ) : salvo ? (
            <span className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm">
              <Check size={14} /> Logo atualizada!
            </span>
          ) : (
            <>
              <p className="text-sm text-gray-400">Arraste ou clique para enviar</p>
              <p className="text-xs text-gray-600 mt-0.5">PNG, JPG, WEBP · máx. 5 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      </div>
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
      {role === "ADMIN" && <LogoSection />}

      {/* Informações do estabelecimento — somente ADMIN */}
      {role === "ADMIN" && <InfoLanchoneteSection />}

      {/* Horários de funcionamento — somente ADMIN */}
      {role === "ADMIN" && <HorariosSection />}

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
