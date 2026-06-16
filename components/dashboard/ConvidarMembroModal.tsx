"use client";

import { useState } from "react";
import { X, AlertTriangle, Eye, EyeOff, Shield, User } from "lucide-react";
import type { RoleUsuario } from "@/types";

interface Props {
  onClose: () => void;
  onSalvo: () => void; // a página revalida a lista (mutate) aqui
}

// Opções de nível de acesso, com texto explicando o que cada um enxerga.
const ROLES: { value: RoleUsuario; label: string; descricao: string; Icon: typeof User }[] = [
  {
    value: "CAIXA",
    label: "Caixa",
    descricao: "Opera pedidos e estoque. Não vê financeiro nem equipe.",
    Icon: User,
  },
  {
    value: "ADMIN",
    label: "Administrador",
    descricao: "Acesso total: financeiro, margens, equipe e configurações.",
    Icon: Shield,
  },
];

export function ConvidarMembroModal({ onClose, onSalvo }: Props) {
  const [nome,        setNome]        = useState("");
  const [email,       setEmail]       = useState("");
  const [senha,       setSenha]       = useState("");
  const [role,        setRole]        = useState<RoleUsuario>("CAIXA");
  const [verSenha,    setVerSenha]    = useState(false);
  const [salvando,    setSalvando]    = useState(false);
  const [erro,        setErro]        = useState<string | null>(null);

  // Validação leve no front (a real está no team.service). Só evita request à toa.
  const senhaMin = senha.length >= 6;
  const podeSalvar =
    nome.trim().length >= 2 && email.trim() !== "" && senhaMin && !salvando;

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/equipe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível adicionar o membro");
      }
      onSalvo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    bg-black/70 px-0 sm:px-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600
                      rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 shrink-0">
          <h2 className="font-bold text-white">Convidar membro</h2>
          <button onClick={onClose} className="btn-ghost px-2">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome</label>
            <input
              type="text"
              placeholder="Ex.: Maria Souza"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white placeholder:text-gray-600
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">E-mail</label>
            <input
              type="email"
              autoComplete="off"
              placeholder="maria@lanchonete.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white placeholder:text-gray-600
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={verSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-3 pr-10
                           text-sm text-white placeholder:text-gray-600
                           focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
              >
                {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {senha.length > 0 && !senhaMin && (
              <p className="text-xs text-red-400 mt-1">A senha precisa ter ao menos 6 caracteres.</p>
            )}
          </div>

          {/* Nível de acesso */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nível de acesso</label>
            <div className="space-y-2">
              {ROLES.map(({ value, label, descricao, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    role === value
                      ? "bg-brand-500/15 border-brand-500/40"
                      : "border-dark-600 hover:border-dark-500"
                  }`}
                >
                  <Icon size={16} className={`shrink-0 mt-0.5 ${role === value ? "text-brand-400" : "text-gray-500"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${role === value ? "text-brand-400" : "text-white"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Erro do servidor */}
          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm
                            flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              {erro}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-dark-600 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={salvar}
            disabled={!podeSalvar}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando…" : "Adicionar membro"}
          </button>
        </div>
      </div>
    </div>
  );
}
