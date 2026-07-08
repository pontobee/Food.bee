"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TipoTransacao, TransacaoDTO } from "@/types";

const CATEGORIAS: Record<TipoTransacao, string[]> = {
  RECEITA: ["Venda", "Serviço", "Outros"],
  DESPESA: ["Insumos", "Embalagens", "Aluguel", "Salários", "Energia/Água", "Marketing", "Manutenção", "Impostos", "Outros"],
};

interface Props {
  onClose:  () => void;
  onSalvo:  (t: TransacaoDTO) => void;
}

export function NovaTransacaoModal({ onClose, onSalvo }: Props) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [tipo,      setTipo]      = useState<TipoTransacao>("DESPESA");
  const [categoria, setCategoria] = useState(CATEGORIAS.DESPESA[0]);
  const [descricao, setDescricao] = useState("");
  const [valor,     setValor]     = useState("");
  const [data,      setData]      = useState(hoje);
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);

  function handleTipo(t: TipoTransacao) {
    setTipo(t);
    setCategoria(CATEGORIAS[t][0]);
  }

  async function salvar() {
    setErro(null);
    const v = parseFloat(valor.replace(",", "."));
    if (!descricao.trim()) return setErro("Informe a descrição");
    if (!v || v <= 0)      return setErro("Informe um valor válido");

    setLoading(true);
    try {
      const res = await fetch("/api/transacoes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tipo, categoria, descricao: descricao.trim(), valor: v, data }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Erro ao salvar");
      }
      const nova: TransacaoDTO = await res.json();
      onSalvo(nova);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Nova Transação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(["DESPESA", "RECEITA"] as TipoTransacao[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTipo(t)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipo === t
                    ? t === "DESPESA"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {t === "DESPESA" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {CATEGORIAS[tipo].map((c) => (
                <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Compra de pão, Conta de luz..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}
        </div>

        {/* Footer */}
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
            {loading ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
