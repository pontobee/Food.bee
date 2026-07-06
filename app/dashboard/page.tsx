"use client";

import useSWR          from "swr";
import { useSession }  from "next-auth/react";
import {
  ShoppingBag, DollarSign, TrendingUp, AlertTriangle, Radio,
} from "lucide-react";
import type { StatsDTO } from "@/types";
import ChartsBI from "@/components/dashboard/ChartsBI";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

function StatCard({
  icon: Icon,
  label,
  value,
  cor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  cor: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session }  = useSession();
  const role               = session?.user?.role;
  const { data: stats }    = useSWR<StatsDTO>("/api/dashboard/stats", fetcher, {
    refreshInterval: 60_000,
  });

  const fmtBRL = (v?: number) =>
    v == null ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Visão Geral</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumo do dia de hoje</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ShoppingBag}
          label="Pedidos hoje"
          value={String(stats?.pedidos_hoje ?? "—")}
          cor="bg-blue-500/15 text-blue-400"
        />
        {role === "ADMIN" && (
          <StatCard
            icon={DollarSign}
            label="Faturamento"
            value={fmtBRL(stats?.faturamento_hoje)}
            cor="bg-emerald-500/15 text-emerald-400"
          />
        )}
        {role === "ADMIN" && (
          <StatCard
            icon={TrendingUp}
            label="Ticket médio"
            value={fmtBRL(stats?.ticket_medio)}
            cor="bg-brand-500/15 text-brand-400"
          />
        )}
        <StatCard
          icon={AlertTriangle}
          label="Estoque crítico"
          value={String(stats?.estoque_critico ?? "—")}
          cor="bg-red-500/15 text-red-400"
        />
      </div>

      {/* Alerta de webhooks pendentes — só para ADMIN */}
      {role === "ADMIN" && (stats?.webhooks_pendentes ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30
                        rounded-xl px-5 py-4">
          <Radio size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-300">
              {stats!.webhooks_pendentes} mensagem
              {stats!.webhooks_pendentes > 1 ? "ns" : ""} WhatsApp com falha
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Verifique a fila de webhooks para detalhes e reenvio.
            </p>
          </div>
        </div>
      )}

      {/* Atalho Kanban */}
      <div className="card p-5">
        <p className="text-sm text-gray-400">
          Acesse <strong className="text-white">Pedidos</strong> no menu para abrir o
          Kanban em tempo real.
        </p>
      </div>

      {/* Gráficos BI — apenas ADMIN */}
      {role === "ADMIN" && <ChartsBI />}
    </div>
  );
}
