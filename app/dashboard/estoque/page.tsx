"use client";

import useSWR          from "swr";
import { useSession }  from "next-auth/react";
import { AlertTriangle, Package } from "lucide-react";
import type { ProdutoDTO } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EstoquePage() {
  const { data: session } = useSession();
  const role              = session?.user?.role;
  const { data = [], isLoading } = useSWR<ProdutoDTO[]>("/api/produtos", fetcher, {
    refreshInterval: 30_000,
  });

  const criticos = data.filter((p) => p.estoque_atual <= p.estoque_minimo);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Estoque</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} produtos ativos</p>
        </div>
        {criticos.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold
                           text-red-400 bg-red-500/10 border border-red-500/20
                           px-3 py-1.5 rounded-full">
            <AlertTriangle size={13} />
            {criticos.length} crítico{criticos.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-600 text-sm">Carregando…</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Estoque</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Preço</th>
                {role === "ADMIN" && (
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Custo</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((produto) => {
                const critico = produto.estoque_atual <= produto.estoque_minimo;
                return (
                  <tr key={produto.id}
                      className="border-b border-dark-600/50 hover:bg-dark-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-gray-500 shrink-0" />
                        <div>
                          <p className="font-medium text-white">{produto.nome}</p>
                          <p className="text-xs text-gray-500">{produto.categoria?.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                        text-xs font-semibold ${
                        critico
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {critico && <AlertTriangle size={11} />}
                        {produto.estoque_atual} {produto.unidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      R$ {Number(produto.preco_venda).toFixed(2).replace(".", ",")}
                    </td>
                    {role === "ADMIN" && (
                      <td className="px-4 py-3 text-right text-gray-400">
                        R$ {Number(produto.preco_custo ?? 0).toFixed(2).replace(".", ",")}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
