"use client";

import { useState, useMemo } from "react";
import { X, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from "lucide-react";
import type { ProdutoDTO } from "@/types";

// Tipos de movimentação — espelham o enum TipoMovimentacaoEstoque do Prisma.
type TipoMov = "ENTRADA" | "SAIDA";

interface Props {
  produtos:    ProdutoDTO[];
  produtoInicialId?: string | null; // pré-seleciona um produto (botão da linha)
  onClose:     () => void;
  onSalvo:     () => void;           // a página chama mutate() do SWR aqui
}

// Sugestões de motivo por tipo — agilizam o preenchimento no balcão.
const MOTIVOS: Record<TipoMov, string[]> = {
  ENTRADA: ["Compra de insumos", "Ajuste de inventário", "Devolução"],
  SAIDA:   ["Desperdício", "Perda / vencimento", "Consumo interno"],
};

export function MovimentacaoModal({ produtos, produtoInicialId, onClose, onSalvo }: Props) {
  const [produtoId,  setProdutoId]  = useState<string>(produtoInicialId ?? "");
  const [tipo,       setTipo]       = useState<TipoMov>("ENTRADA");
  const [quantidade, setQuantidade] = useState<string>(""); // string p/ permitir campo vazio
  const [motivo,     setMotivo]     = useState<string>("");
  const [salvando,   setSalvando]   = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  // Produto selecionado e cálculo do saldo previsto.
  const produto = useMemo(
    () => produtos.find((p) => p.id === produtoId) ?? null,
    [produtos, produtoId]
  );

  const qtdNum = Number(quantidade);
  const qtdValida = Number.isInteger(qtdNum) && qtdNum > 0;
  const delta = tipo === "ENTRADA" ? qtdNum : -qtdNum;
  const saldoPrevisto = produto ? produto.estoque_atual + delta : 0;
  // Mesma trava do servidor, refletida no front para feedback imediato.
  const ficariaNegativo = produto !== null && qtdValida && saldoPrevisto < 0;

  const podeConfirmar = !!produto && qtdValida && !ficariaNegativo && !salvando;

  async function salvar() {
    if (!podeConfirmar) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/estoque/movimentacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produtoId,
          tipo,
          quantidade: qtdNum,
          motivo:     motivo.trim() || null,
        }),
      });
      if (!res.ok) {
        // O servidor manda { error: "mensagem" } nos casos 400/404.
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível registrar a movimentação");
      }
      onSalvo(); // dispara o refresh da tabela e fecha o modal
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

        {/* Header do modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 shrink-0">
          <h2 className="font-bold text-white">Movimentar estoque</h2>
          <button onClick={onClose} className="btn-ghost px-2">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">

          {/* Produto */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Produto</label>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="" disabled>Selecione um produto…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.estoque_atual} {p.unidade}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo: Entrada / Saída */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("ENTRADA")}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold
                            border transition-colors ${
                  tipo === "ENTRADA"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "border-dark-500 text-gray-400 hover:text-white"
                }`}
              >
                <ArrowUpCircle size={16} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo("SAIDA")}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold
                            border transition-colors ${
                  tipo === "SAIDA"
                    ? "bg-red-500/15 border-red-500/40 text-red-400"
                    : "border-dark-500 text-gray-400 hover:text-white"
                }`}
              >
                <ArrowDownCircle size={16} /> Saída
              </button>
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quantidade</label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white placeholder:text-gray-600
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Motivo + sugestões */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Motivo <span className="text-gray-600 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex.: Compra de insumos"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white placeholder:text-gray-600
                         focus:border-brand-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MOTIVOS[tipo].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className="px-2 py-1 rounded-full text-xs border border-dark-500
                             text-gray-400 hover:text-white hover:border-dark-400 transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Prévia do saldo */}
          {produto && qtdValida && (
            <div className={`rounded-lg border p-3 text-sm ${
              ficariaNegativo
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-dark-600 bg-dark-700 text-gray-300"
            }`}>
              {ficariaNegativo ? (
                <span className="flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  Saldo insuficiente: não dá para retirar {qtdNum} de {produto.estoque_atual} {produto.unidade}.
                </span>
              ) : (
                <span>
                  Saldo: <strong className="text-white">{produto.estoque_atual}</strong>
                  {" → "}
                  <strong className={tipo === "ENTRADA" ? "text-emerald-400" : "text-red-400"}>
                    {saldoPrevisto}
                  </strong>{" "}
                  {produto.unidade}
                </span>
              )}
            </div>
          )}

          {/* Erro vindo do servidor */}
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
            disabled={!podeConfirmar}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
