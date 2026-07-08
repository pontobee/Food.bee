"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut }               from "next-auth/react";
import { useRouter }                         from "next/navigation";
import Link                                  from "next/link";
import {
  UtensilsCrossed, Check, LogOut, ArrowLeft,
  AlertTriangle, Clock, Ban, CheckCircle2,
  Copy, CheckCheck, Loader2, QrCode,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

type PlanoId = "BASICO" | "PRO" | "ENTERPRISE";

type Estado =
  | { tipo: "planos" }
  | { tipo: "carregando"; plano: PlanoId }
  | { tipo: "pix"; plano: PlanoId; dados: PixDados }
  | { tipo: "confirmado" }
  | { tipo: "erro"; mensagem: string };

interface PixDados {
  pix_qrcode_image: string;
  pix_payload: string;
  valor: number;
  vencimento: string;
}

const PLANOS = [
  {
    id: "BASICO" as PlanoId,
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
    id: "PRO" as PlanoId,
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
    id: "ENTERPRISE" as PlanoId,
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

const STATUS_INFO: Record<string, { texto: string; className: string; Icon: typeof Clock }> = {
  TRIAL: {
    texto: "Você está no período de teste gratuito (14 dias).",
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
  const { data: session, update } = useSession();
  const router = useRouter();

  const [estado,    setEstado]    = useState<Estado>({ tipo: "planos" });
  const [copiado,   setCopiado]   = useState(false);

  const status   = session?.user?.assinatura_status ?? "TRIAL";
  const isAdmin  = session?.user?.role === "ADMIN";
  const bloqueado = status === "INADIMPLENTE" || status === "SUSPENSA" || status === "CANCELADA";
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.TRIAL;
  const StatusIcon = statusInfo.Icon;

  // Polling do status após PIX ser exibido
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/assinatura/status");
      if (!res.ok) return;
      const data: { status: string } = await res.json();
      if (data.status === "ATIVA") {
        setEstado({ tipo: "confirmado" });
        await update(); // atualiza JWT com o novo status
        setTimeout(() => router.replace("/dashboard"), 2000);
      }
    } catch {
      // silencia erros de rede no polling
    }
  }, [update, router]);

  useEffect(() => {
    if (estado.tipo !== "pix") return;
    const id = setInterval(pollStatus, 3000);
    return () => clearInterval(id);
  }, [estado.tipo, pollStatus]);

  async function iniciarCheckout(plano: PlanoId) {
    setEstado({ tipo: "carregando", plano });
    try {
      const res = await fetch("/api/assinatura/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plano }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstado({ tipo: "erro", mensagem: data.error ?? "Erro ao gerar cobrança." });
        return;
      }
      setEstado({ tipo: "pix", plano, dados: data as PixDados });
    } catch {
      setEstado({ tipo: "erro", mensagem: "Erro de conexão. Tente novamente." });
    }
  }

  async function copiarCodigo(payload: string) {
    await navigator.clipboard.writeText(payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  // ── Tela: Pagamento confirmado ──────────────────────────────────
  if (estado.tipo === "confirmado") {
    return (
      <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Pagamento confirmado!</h2>
          <p className="text-gray-400 text-sm">Redirecionando para o painel...</p>
          <Loader2 size={20} className="animate-spin text-brand-400 mx-auto" />
        </div>
      </main>
    );
  }

  // ── Tela: QR Code PIX ──────────────────────────────────────────
  if (estado.tipo === "pix") {
    const { dados, plano } = estado;
    const nomeP = PLANOS.find((p) => p.id === plano)?.nome ?? plano;

    return (
      <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-4">

          <div className="flex flex-col items-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-2">
              <QrCode className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Pague com PIX</h2>
            <p className="text-sm text-gray-500">
              Plano {nomeP} — {formatCurrency(dados.valor)}/mês
            </p>
          </div>

          <div className="card p-5 flex flex-col items-center gap-4">
            {/* QR Code */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${dados.pix_qrcode_image}`}
              alt="QR Code PIX"
              className="w-52 h-52 rounded-xl"
            />

            {/* Copia e cola */}
            <div className="w-full">
              <p className="text-xs text-gray-500 mb-1.5">Copia e cola</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={dados.pix_payload}
                  className="flex-1 h-9 bg-dark-700 border border-dark-600 rounded-lg
                             px-3 text-xs text-gray-300 font-mono truncate"
                />
                <button
                  onClick={() => copiarCodigo(dados.pix_payload)}
                  className="h-9 px-3 rounded-lg border border-dark-600 bg-dark-700
                             text-gray-300 hover:text-white hover:border-brand-500 transition-colors"
                >
                  {copiado ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Aguardando */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-brand-400 shrink-0" />
              Aguardando confirmação do pagamento...
            </div>
          </div>

          <button
            onClick={() => setEstado({ tipo: "planos" })}
            className="btn-ghost w-full justify-center text-sm"
          >
            <ArrowLeft size={14} /> Voltar aos planos
          </button>

        </div>
      </main>
    );
  }

  // ── Tela: Grade de planos ───────────────────────────────────────
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

        {/* Erro */}
        {estado.tipo === "erro" && (
          <div className="card border border-red-500/30 bg-red-500/10 p-4 mb-6
                          flex items-center gap-3 text-sm text-red-400">
            <AlertTriangle size={16} className="shrink-0" />
            {estado.mensagem}
            <button
              onClick={() => setEstado({ tipo: "planos" })}
              className="ml-auto underline text-xs"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Planos LancheSmart</h2>
          <p className="text-sm text-gray-500 mt-1">
            Escolha o plano ideal para o tamanho da sua lanchonete.
          </p>
        </div>

        {/* Grid de planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANOS.map((plano) => {
            const carregando =
              estado.tipo === "carregando" && estado.plano === plano.id;

            return (
              <div
                key={plano.id}
                className={`card p-5 flex flex-col ${
                  plano.destaque ? "border-brand-500 ring-1 ring-brand-500/30" : ""
                }`}
              >
                {plano.destaque && (
                  <span className="self-start mb-2 px-2 py-0.5 rounded-full text-xs
                                   font-semibold bg-brand-500/15 text-brand-400">
                    Mais popular
                  </span>
                )}

                <h3 className="text-base font-bold text-white">{plano.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5 mb-4">{plano.descricao}</p>

                <p className="mb-4">
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(plano.preco)}
                  </span>
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
                    onClick={() => iniciarCheckout(plano.id)}
                    disabled={estado.tipo === "carregando"}
                    className="btn-primary w-full justify-center"
                  >
                    {carregando
                      ? <Loader2 size={15} className="animate-spin" />
                      : `Escolher ${plano.nome}`}
                  </button>
                ) : (
                  <div className="btn-ghost w-full justify-center cursor-default border border-dark-600 text-gray-500">
                    Escolher {plano.nome}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isAdmin && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Fale com o administrador da sua lanchonete para alterar o plano da assinatura.
          </p>
        )}

      </div>
    </main>
  );
}
