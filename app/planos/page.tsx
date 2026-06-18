"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  UtensilsCrossed, Check, LogOut, ArrowLeft,
  AlertTriangle, Clock, Ban, CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

type PlanoId = "BASICO" | "PRO" | "ENTERPRISE";

const PLANOS: Array<{
  id: PlanoId;
  nome: string;
  preco: number;
  descricao: string;
  destaque?: boolean;
  recursos: string[];
}> = [
  {
    id: "BASICO",
    nome: "Básico",
    preco: 79.9,
    descricao: "Para quem está começando",
    recursos: [
      "Kanban de pedidos",
      "Cadastro de produtos e adicionais",
      "1 usuário administrador",
      "Histórico de pedidos",
    ],
  },
  {
    id: "PRO",
    nome: "Pro",
    preco: 179.9,
    descricao: "Para lanchonetes em crescimento",
    destaque: true,
    recursos: [
      "Tudo do plano Básico",
      "Painel financeiro completo",
      "Usuários ilimitados (admin + caixa)",
      "Integração com WhatsApp",
    ],
  },
  {
    id: "ENTERPRISE",
    nome: "Enterprise",
    preco: 199.9,
    descricao: "Para redes com várias unidades",
    recursos: [
      "Tudo do plano Pro",
      "Múltiplas lanchonetes",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
];

const STATUS_INFO: Record<
  string,
  { texto: string; className: string; Icon: typeof Clock }
> = {
  TRIAL: {
    texto: "Você está no período de teste gratuito.",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    Icon: Clock,
  },
  ATIVA: {
    texto: "Sua assinatura está ativa.",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    Icon: CheckCircle2,
  },
  INADIMPLENTE: {
    texto: "Pagamento pendente. Escolha um plano abaixo para reativar o acesso.",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    Icon: AlertTriangle,
  },
  SUSPENSA: {
    texto: "Sua assinatura está suspensa.",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    Icon: Ban,
  },
  CANCELADA: {
    texto: "Sua assinatura foi cancelada.",
    className: "border-dark-500 bg-dark-700 text-gray-400",
    Icon: Ban,
  },
};

export default function PlanosPage() {
  const { data: session } = useSession();
  const [selecionado, setSelecionado] = useState<PlanoId | null>(null);

  const status = session?.user?.assinatura_status ?? "TRIAL";
  const isAdmin = session?.user?.role === "ADMIN";
  const bloqueado = status === "INADIMPLENTE" || status === "SUSPENSA" || status === "CANCELADA";

  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.TRIAL;
  const StatusIcon = statusInfo.Icon;

  return (
    <main className="min-h-screen bg-dark-900 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Topo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">LancheSmart</h1>
              {session?.user?.lanchonete_nome && (
                <p className="text-xs text-gray-500">{session.user.lanchonete_nome}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!bloqueado && (
              <Link href="/dashboard" className="btn-ghost text-sm">
                <ArrowLeft size={15} /> Voltar ao painel
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-ghost text-sm text-gray-400 hover:text-red-400"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>

        {/* Status da assinatura */}
        <div className={`card border p-4 mb-8 flex items-center gap-3 ${statusInfo.className}`}>
          <StatusIcon size={18} className="shrink-0" />
          <p className="text-sm font-medium">{statusInfo.texto}</p>
        </div>

        {/* Cabeçalho dos planos */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Planos LancheSmart</h2>
          <p className="text-sm text-gray-500 mt-1">
            Escolha o plano ideal para o tamanho da sua lanchonete.
          </p>
        </div>

        {/* Grid de planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANOS.map((plano) => (
            <div
              key={plano.id}
              className={`card p-5 flex flex-col ${
                plano.destaque ? "border-brand-500 ring-1 ring-brand-500/30" : ""
              }`}
            >
              {plano.destaque && (
                <span className="self-start mb-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400">
                  Mais popular
                </span>
              )}

              <h3 className="text-base font-bold text-white">{plano.nome}</h3>
              <p className="text-sm text-gray-500 mt-0.5 mb-4">{plano.descricao}</p>

              <p className="mb-4">
                <span className="text-2xl font-bold text-white">{formatCurrency(plano.preco)}</span>
                <span className="text-sm text-gray-500">/mês</span>
              </p>

              <ul className="space-y-2 mb-5 flex-1">
                {plano.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={15} className="text-brand-400 shrink-0 mt-0.5" />
                    {recurso}
                  </li>
                ))}
              </ul>

              {isAdmin ? (
                <button
                  onClick={() => setSelecionado(plano.id)}
                  className="btn-primary w-full justify-center"
                >
                  Escolher {plano.nome}
                </button>
              ) : (
                <div className="btn-ghost w-full justify-center cursor-default border border-dark-600">
                  Escolher {plano.nome}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Confirmação */}
        {selecionado && (
          <div className="card p-4 mt-6 flex items-center gap-2 text-sm text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
            <Check size={15} className="shrink-0" />
            Solicitação registrada! Nosso time vai entrar em contato para liberar o plano{" "}
            {PLANOS.find((p) => p.id === selecionado)?.nome}.
          </div>
        )}

        {/* Aviso para não-admin */}
        {!isAdmin && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Fale com o administrador da sua lanchonete para alterar o plano da assinatura.
          </p>
        )}

      </div>
    </main>
  );
}
