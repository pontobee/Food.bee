"use client";

import { useState }    from "react";
import useSWR          from "swr";
import { useSession }  from "next-auth/react";
import { Users, Shield, User, UserPlus, Lock, Mail, Pencil, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import type { MembroDTO } from "@/types";
import { formatDate } from "@/utils/formatDate";
import { ConvidarMembroModal } from "@/components/dashboard/ConvidarMembroModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EquipePage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // Só busca a lista se for ADMIN. A chave `null` faz o SWR não disparar request
  // (o backend devolveria 403 de qualquer forma — aqui evitamos a chamada à toa).
  const { data: membros = [], isLoading, mutate } = useSWR<MembroDTO[]>(
    isAdmin ? "/api/equipe" : null,
    fetcher,
  );

  const [modalAberto,   setModalAberto]   = useState(false);
  const [editandoId,    setEditandoId]    = useState<string | null>(null);
  const [novaRole,      setNovaRole]      = useState<"ADMIN" | "CAIXA">("CAIXA");
  const [removendoId,   setRemovendoId]   = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MembroDTO | null>(null);
  const [salvando,      setSalvando]      = useState(false);

  // Enquanto a sessão carrega, não decidimos nada (evita "piscar" o bloqueio).
  if (status === "loading") {
    return <p className="text-gray-600 text-sm">Carregando…</p>;
  }

  // Guard de acesso no frontend — defesa em profundidade.
  // Mesmo que alguém force a URL, vê esta tela; e a API recusaria os dados (403).
  if (!isAdmin) {
    return (
      <div className="card p-8 flex flex-col items-center text-center max-w-md mx-auto mt-10">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={22} className="text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-white">Acesso restrito</h1>
        <p className="text-sm text-gray-500 mt-2">
          Apenas administradores podem gerenciar a equipe. Fale com o administrador
          da sua lanchonete.
        </p>
      </div>
    );
  }

  async function salvarRole(id: string) {
    setSalvando(true);
    await fetch(`/api/equipe/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role: novaRole }),
    });
    setSalvando(false);
    setEditandoId(null);
    mutate();
  }

  async function removerMembro(id: string) {
    setRemovendoId(id);
    await fetch(`/api/equipe/${id}`, { method: "DELETE" });
    setRemovendoId(null);
    setConfirmRemove(null);
    mutate();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Equipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {membros.length} {membros.length === 1 ? "membro" : "membros"} na sua lanchonete
          </p>
        </div>
        <button onClick={() => setModalAberto(true)} className="btn-primary text-sm">
          <UserPlus size={15} />
          Convidar membro
        </button>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <p className="text-gray-600 text-sm">Carregando…</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Membro</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acesso</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Último acesso</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Desde</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {membros.map((membro) => {
                const ehAdmin  = membro.role === "ADMIN";
                const ehVoce   = membro.id === session?.user?.id;
                const editando = editandoId === membro.id;
                return (
                  <tr key={membro.id}
                      className="border-b border-dark-600/50 hover:bg-dark-700 transition-colors">
                    {/* Membro */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center shrink-0">
                          <Users size={14} className="text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white flex items-center gap-2">
                            {membro.nome}
                            {ehVoce && (
                              <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/15 px-1.5 py-0.5 rounded-full">
                                você
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={11} /> {membro.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Acesso (role) — inline edit */}
                    <td className="px-4 py-3">
                      {editando ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={novaRole}
                            onChange={(e) => setNovaRole(e.target.value as "ADMIN" | "CAIXA")}
                            className="h-8 bg-dark-700 border border-dark-600 rounded-lg px-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                          >
                            <option value="CAIXA">Caixa</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                          <button
                            onClick={() => salvarRole(membro.id)}
                            disabled={salvando}
                            className="h-8 px-2 rounded-lg bg-brand-500 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            {salvando ? <Loader2 size={12} className="animate-spin" /> : "OK"}
                          </button>
                          <button onClick={() => setEditandoId(null)} className="h-8 px-1.5 rounded-lg text-gray-400 hover:text-white">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          ehAdmin ? "bg-brand-500/15 text-brand-400" : "bg-dark-600 text-gray-300"
                        }`}>
                          {ehAdmin ? <Shield size={11} /> : <User size={11} />}
                          {ehAdmin ? "Administrador" : "Caixa"}
                        </span>
                      )}
                    </td>

                    {/* Último acesso */}
                    <td className="px-4 py-3 text-right text-gray-400">
                      {membro.ultimo_acesso_em
                        ? formatDate(new Date(membro.ultimo_acesso_em))
                        : <span className="text-gray-600">nunca</span>}
                    </td>

                    {/* Membro desde */}
                    <td className="px-4 py-3 text-right text-gray-400">
                      {formatDate(new Date(membro.criado_em))}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      {!ehVoce && !editando && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditandoId(membro.id); setNovaRole(membro.role as "ADMIN" | "CAIXA"); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                            title="Editar acesso"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmRemove(membro)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remover membro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de convite */}
      {modalAberto && (
        <ConvidarMembroModal
          onClose={() => setModalAberto(false)}
          onSalvo={() => {
            mutate();
            setModalAberto(false);
          }}
        />
      )}

      {/* Modal de confirmação de remoção */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm bg-dark-800 border border-dark-600 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={17} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white">Remover membro</h3>
            </div>
            <p className="text-sm text-gray-400">
              <strong className="text-white">{confirmRemove.nome}</strong> perderá o acesso ao painel.
              Esta ação pode ser revertida convidando-o novamente.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmRemove(null)} className="btn-ghost text-sm">Cancelar</button>
              <button
                onClick={() => removerMembro(confirmRemove.id)}
                disabled={removendoId === confirmRemove.id}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {removendoId === confirmRemove.id ? <Loader2 size={14} className="animate-spin" /> : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
