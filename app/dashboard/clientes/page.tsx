"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR                               from "swr";
import { useSession }                       from "next-auth/react";
import { useRouter }                        from "next/navigation";
import { Plus, Search, Users, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ClienteModal }        from "@/components/clientes/ClienteModal";
import { ClienteDetalhePanel } from "@/components/clientes/ClienteDetalhePanel";
import type { ClienteDTO, ClientesPageDTO } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function ClientesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.replace("/dashboard");
  }, [session, router]);

  const [busca,          setBusca]          = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [page,           setPage]           = useState(1);
  const [modalAberto,    setModalAberto]    = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  const isAdmin = session?.user.role === "ADMIN";

  const query = new URLSearchParams({
    ...(buscaDebounced ? { busca: buscaDebounced } : {}),
    page: String(page),
  }).toString();

  const { data, mutate } = useSWR<ClientesPageDTO>(
    isAdmin ? `/api/clientes?${query}` : null,
    fetcher
  );

  const handleNovoCriado = useCallback((c: ClienteDTO) => {
    mutate();
    setModalAberto(false);
  }, [mutate]);

  const handleAtualizado = useCallback((c: ClienteDTO) => {
    mutate();
  }, [mutate]);

  async function excluir(id: string, nome: string) {
    if (!confirm(`Remover "${nome}"?`)) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    mutate();
    if (clienteSelecionado === id) setClienteSelecionado(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Clientes</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Conteúdo */}
      {!data ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : data.clientes.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <Users size={32} className="text-gray-600" />
          <p className="text-gray-400 text-sm">
            {buscaDebounced ? `Nenhum cliente encontrado para "${buscaDebounced}"` : "Nenhum cliente cadastrado ainda."}
          </p>
          {!buscaDebounced && (
            <button
              onClick={() => setModalAberto(true)}
              className="text-brand-400 text-sm hover:underline"
            >
              Cadastrar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Telefone</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Endereço</th>
                    <th className="text-right px-4 py-3">Pedidos</th>
                    <th className="text-right px-4 py-3">Total gasto</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.clientes.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setClienteSelecionado(c.id)}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-white">{c.nome}</td>
                      <td className="px-4 py-3 text-gray-400">{c.telefone}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-xs truncate">
                        {c.endereco ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">{c.total_pedidos}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400">{fmtBRL(c.total_gasto)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); excluir(c.id, c.nome); }}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.paginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <span className="text-xs text-gray-500">
                  {data.total} clientes · página {page} de {data.paginas}
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
                    onClick={() => setPage((p) => Math.min(data.paginas, p + 1))}
                    disabled={page === data.paginas}
                    className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {modalAberto && (
        <ClienteModal
          onClose={() => setModalAberto(false)}
          onSalvo={handleNovoCriado}
        />
      )}

      {clienteSelecionado && (
        <ClienteDetalhePanel
          clienteId={clienteSelecionado}
          onClose={() => setClienteSelecionado(null)}
          onAtualizado={handleAtualizado}
        />
      )}
    </div>
  );
}
