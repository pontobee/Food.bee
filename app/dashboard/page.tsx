"use client";

import useSWR         from "swr";
import { useSession } from "next-auth/react";
import {
  ShoppingBag, DollarSign, TrendingUp, AlertTriangle, Radio,
  ArrowRight, LayoutDashboard,
} from "lucide-react";
import Link            from "next/link";
import type { StatsDTO } from "@/types";
import ChartsBI        from "@/components/dashboard/ChartsBI";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

type StatCardProps = {
  icon:    React.ElementType;
  label:   string;
  value:   string;
  iconBg:  string;
  iconFg:  string;
  index?:  number;
};

function StatCard({ icon: Icon, label, value, iconBg, iconFg, index = 0 }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fade-in"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={19} className={iconFg} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
          {label}
        </p>
        <p className="text-xl font-bold text-white mt-0.5 truncate tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role              = session?.user?.role;
  const { data: stats }   = useSWR<StatsDTO>("/api/dashboard/stats", fetcher, {
    refreshInterval: 60_000,
  });

  const fmtBRL = (v?: number) =>
    v == null ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand-subtle border border-brand-500/20 flex items-center justify-center">
            <LayoutDashboard size={16} className="text-brand-400" />
          </div>
          <div>
            <h1 className="section-title">Visão Geral</h1>
            <p className="section-subtitle">Resumo do dia de hoje</p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          index={0}
          icon={ShoppingBag}
          label="Pedidos hoje"
          value={String(stats?.pedidos_hoje ?? "—")}
          iconBg="bg-blue-500/10 border border-blue-500/15"
          iconFg="text-blue-400"
        />
        {role === "ADMIN" && (
          <StatCard
            index={1}
            icon={DollarSign}
            label="Faturamento"
            value={fmtBRL(stats?.faturamento_hoje)}
            iconBg="bg-emerald-500/10 border border-emerald-500/15"
            iconFg="text-emerald-400"
          />
        )}
        {role === "ADMIN" && (
          <StatCard
            index={2}
            icon={TrendingUp}
            label="Ticket médio"
            value={fmtBRL(stats?.ticket_medio)}
            iconBg="bg-gradient-brand-subtle border border-brand-500/15"
            iconFg="text-brand-400"
          />
        )}
        <StatCard
          index={3}
          icon={AlertTriangle}
          label="Estoque crítico"
          value={String(stats?.estoque_critico ?? "—")}
          iconBg="bg-red-500/10 border border-red-500/15"
          iconFg="text-red-400"
        />
      </div>

      {/* ── Alerta webhooks ── */}
      {role === "ADMIN" && (stats?.webhooks_pendentes ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/25
                        rounded-2xl px-5 py-4 animate-fade-in">
          <Radio size={18} className="text-amber-400 shrink-0 mt-0.5 animate-pulse-dot" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-300">
              {stats!.webhooks_pendentes} mensagem
              {stats!.webhooks_pendentes > 1 ? "ns" : ""} WhatsApp com falha
            </p>
            <p className="text-xs text-amber-400/60 mt-1">
              Verifique a fila de webhooks para detalhes e reenvio.
            </p>
          </div>
        </div>
      )}

      {/* ── Atalho Kanban ── */}
      <Link
        href="/dashboard/pedidos"
        className="card p-5 flex items-center justify-between group hover:border-brand-500/30 hover:shadow-card-lg transition-all duration-200 block"
      >
        <p className="text-sm text-gray-400">
          Acesse o{" "}
          <strong className="text-white font-semibold">Kanban de Pedidos</strong>
          {" "}em tempo real para acompanhar o fluxo da cozinha.
        </p>
        <ArrowRight
          size={16}
          className="text-brand-400 shrink-0 ml-4 group-hover:translate-x-1 transition-transform duration-200"
        />
      </Link>

      {/* ── Gráficos BI — apenas ADMIN ── */}
      {role === "ADMIN" && <ChartsBI />}
    </div>
  );
}
