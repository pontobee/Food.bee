"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR                               from "swr";
import { useSession }                       from "next-auth/react";
import { useRouter }                        from "next/navigation";
import {
  TrendingUp, TrendingDown, DollarSign,
  Plus, Download, Trash2, ChevronLeft, ChevronRight,
  Filter,
} from "lucide-react";
import { NovaTransacaoModal } from "@/components/financeiro/NovaTransacaoModal";
import type { TransacaoDTO, TransacoesPageDTO, TipoTransacao } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

interface ResumoFinanceiro {
  receita_mes:  number;
  despesa_mes:  number;
  lucro_mes:    number;
  receita_hoje: number;
}

const fmtBRL  = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function buildQuery(params: Record<string, string>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
  return q.toString() ? `?${q}` : "";
}

export default function FinanceiroPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.replace("/dashboard");
  }, [session, router]);

  const [modalAberto, setModalAberto] = useState(false);
  const [page,        setPage]        = useState(1);
  const [tipo,        setTipo]        = useState<TipoTransacao | "">("");
  const [categoria,   setCategoria]   = useState("");
  const [inicio,      setInicio]      = useState("");
  const [fim,         setFim]         = useState("");

  const isAdmin = session?.user.role === "ADMIN";

  const { data: resumo } = useSWR<ResumoFinanceiro>(
    isAdmin ? "/api/financeiro/resumo" : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const queryStr = isAdmin
    ? buildQuery({ tipo, categoria, inicio, fim, page: String(page) })
    : null;

  const { data: lista, mutate } = useSWR<TransacoesPageDTO>(
    queryStr !== null ? `/api/transacoes${queryStr}` : null,
    fetcher
  );

  function resetFiltros() {
    setTipo("");
    setCategoria("");
    setInicio("");
    setFim("");
    setPage(1);
  }

  function handleFiltroChange(cb: () => void) {
    cb();
    setPage(1);
  }

  const handleSalvo = useCallback((nova: TransacaoDTO) => {
    mutate();
    setModalAberto(false);
    // Revalida resumo também
    void fetcher("/api/financeiro/resumo");
  }, [mutate]);

  async function excluir(id: string) {
    if (!confirm("Remover esta transação?")) return;
    await fetch(`/api/transacoes/${id}`, { method: "DELETE" });
    mutate();
  }

  function exportarCSV() {
    if (!lista?.transacoes.length) return;
    const header = "Data,Tipo,Categoria,Descrição,Valor,Lançado por";
    const rows = lista.transacoes.map((t) =>
      [
        fmtData(t.data),
        t.tipo,
        t.categoria,
        `"${t.descricao.replace(/"/g, '""')}"`,
        t.valor.toFixed(2).replace(".", ","),
        t.usuario_nome,
      ].join(",")
    );
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `financeiro-${inicio || "todos"}-${fim || "todos"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = resumo
    ? [
        { label: "Receita do mês",  value: resumo.receita_mes,  icon: TrendingUp,   cor: "bg-emerald-500/15 text-emerald-400" },
        { label: "Despesas do mês", value: resumo.despesa_mes,  icon: TrendingDown, cor: "bg-red-500/15 text-red-400"         },
        { label: "Lucro do mês",    value: resumo.lucro_mes,    icon: DollarSign,   cor: "bg-brand-500/15 text-brand-400"     },
        { label: "Receita hoje",    value: resumo.receita_hoje, icon: TrendingUp,   cor: "bg-blue-500/15 text-blue-400"       },
      ]
    : [];

  const temFiltro = !!(tipo || categoria || inicio || fim);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Financeiro</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nova transação
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, cor }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{fmtBRL(value)}</p>
            </div>
          </div>
        ))}
        {!resumo && (
          <div className="col-span-4 text-sm text-gray-500">Carregando resumo…</div>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm shrink-0">
            <Filter size={14} />
            Filtros
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">De</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => handleFiltroChange(() => setInicio(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Até</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => handleFiltroChange(() => setFim(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => handleFiltroChange(() => setTipo(e.target.value as TipoTransacao | ""))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="" className="bg-[#1a1a1a]">Todos</option>
              <option value="RECEITA" className="bg-[#1a1a1a]">Receita</option>
              <option value="DESPESA" className="bg-[#1a1a1a]">Despesa</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Categoria</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => handleFiltroChange(() => setCategoria(e.target.value))}
              placeholder="Ex: Insumos"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 w-36"
            />
          </div>

          {temFiltro && (
            <button
              onClick={resetFiltros}
              className="text-xs text-gray-400 hover:text-white underline self-end pb-1.5 transition-colors"
            >
              Limpar
            </button>
          )}

          <button
            onClick={exportarCSV}
            disabled={!lista?.transacoes.length}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-40 transition-colors self-end"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {!lista ? (
          <p className="text-sm text-gray-500 p-5">Carregando…</p>
        ) : lista.transacoes.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">Nenhuma transação encontrada.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Data</th>
                    <th className="text-left px-4 py-3">Tipo</th>
                    <th className="text-left px-4 py-3">Categoria</th>
                    <th className="text-left px-4 py-3">Descrição</th>
                    <th className="text-left px-4 py-3">Lançado por</th>
                    <th className="text-right px-4 py-3">Valor</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {lista.transacoes.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtData(t.data)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.tipo === "RECEITA"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {t.tipo === "RECEITA" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{t.categoria}</td>
                      <td className="px-4 py-3 text-white max-w-xs truncate">{t.descricao}</td>
                      <td className="px-4 py-3 text-gray-400">{t.usuario_nome}</td>
                      <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                        t.tipo === "RECEITA" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {t.tipo === "DESPESA" ? "- " : "+ "}{fmtBRL(t.valor)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!t.pedido_id && (
                          <button
                            onClick={() => excluir(t.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {lista.paginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <span className="text-xs text-gray-500">
                  {lista.total} transações · página {page} de {lista.paginas}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(lista.paginas, p + 1))}
                    disabled={page === lista.paginas}
                    className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalAberto && (
        <NovaTransacaoModal
          onClose={() => setModalAberto(false)}
          onSalvo={handleSalvo}
        />
      )}
    </div>
  );
}
