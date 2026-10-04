"use client";

import useSWR          from "swr";
import { useSession }  from "next-auth/react";
import { Radio } from "lucide-react";
import type { StatsDTO } from "@/types";
import ChartsBI from "@/components/dashboard/ChartsBI";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatsCard } from "@/components/ui/StatsCard";
import { cn } from "@/utils/cn";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export default function DashboardPage() {
  const { data: session }  = useSession();
  const role               = session?.user?.role;
  const { data: stats }    = useSWR<StatsDTO>("/api/dashboard/stats", fetcher, {
    refreshInterval: 60_000,
  });

  const fmtBRL = (v?: number) =>
    v == null ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  const estoqueCritico = stats?.estoque_critico ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Resumo do dia de hoje"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {role === "ADMIN" && (
          <StatsCard
            featured
            label="Faturamento"
            value={fmtBRL(stats?.faturamento_hoje)}
          />
        )}
        <StatsCard
          label="Pedidos"
          value={String(stats?.pedidos_hoje ?? "—")}
        />
        {role === "ADMIN" && (
          <StatsCard
            label="Ticket médio"
            value={fmtBRL(stats?.ticket_medio)}
          />
        )}
        <StatsCard
          label="Estoque"
          value={estoqueCritico == null ? "—" : String(estoqueCritico)}
          hint={
            estoqueCritico == null
              ? undefined
              : estoqueCritico === 0
                ? "Tudo em ordem"
                : estoqueCritico === 1
                  ? "1 item precisa de atenção"
                  : `${estoqueCritico} itens precisam de atenção`
          }
          className={cn(
            estoqueCritico != null && estoqueCritico > 0 && "border-red-500/30",
          )}
        />
      </div>

      {role === "ADMIN" && (stats?.webhooks_pendentes ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25
                        rounded-xl px-5 py-4">
          <Radio size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-300">
              {stats!.webhooks_pendentes} mensagem
              {stats!.webhooks_pendentes > 1 ? "ns" : ""} WhatsApp com falha
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Verifique a fila de webhooks para detalhes e reenvio.
            </p>
          </div>
        </div>
      )}

      {role === "ADMIN" && <ChartsBI />}
    </div>
  );
}
