"use client";

import { useState } from "react";
import { X }        from "lucide-react";
import type { ClienteDTO } from "@/types";

interface Props {
  cliente?: ClienteDTO;
  onClose:  () => void;
  onSalvo:  (c: ClienteDTO) => void;
}

export function ClienteModal({ cliente, onClose, onSalvo }: Props) {
  const editando = !!cliente;

  const [nome,     setNome]     = useState(cliente?.nome     ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [endereco, setEndereco] = useState(cliente?.endereco ?? "");
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    if (!nome.trim())     return setErro("Nome obrigatório");
    if (!telefone.trim()) return setErro("Telefone obrigatório");

    setLoading(true);
    try {
      const url    = editando ? `/api/clientes/${cliente!.id}` : "/api/clientes";
      const method = editando ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Erro ao salvar");
      }
      const c: ClienteDTO = await res.json();
      onSalvo(c);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">
            {editando ? "Editar cliente" : "Novo cliente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 91234-5678"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Endereço <span className="text-gray-600 normal-case">(opcional)</span></label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 42"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}
        </div>

        <div className="flex gap-2 p-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-gray-400 border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando…" : editando ? "Salvar" : "Criar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
