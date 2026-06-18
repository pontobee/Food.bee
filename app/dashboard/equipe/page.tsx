"use client";

import { useState }    from "react";
import useSWR          from "swr";
import { useSession }  from "next-auth/react";
import { Users, Shield, User, UserPlus, Lock, Mail } from "lucide-react";
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

  const [modalAberto, setModalAberto] = useState(false);

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
              </tr>
            </thead>
            <tbody>
              {membros.map((membro) => {
                const ehAdmin = membro.role === "ADMIN";
                const ehVoce  = membro.id === session?.user?.id;
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

                    {/* Acesso (role) */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                                        text-xs font-semibold ${
                        ehAdmin
                          ? "bg-brand-500/15 text-brand-400"
                          : "bg-dark-600 text-gray-300"
                      }`}>
                        {ehAdmin ? <Shield size={11} /> : <User size={11} />}
                        {ehAdmin ? "Administrador" : "Caixa"}
                      </span>
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
            mutate();               // recarrega /api/equipe com o novo membro
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}
