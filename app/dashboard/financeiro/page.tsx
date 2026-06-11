"use client";

import useSWR         from "swr";
import { useSession } from "next-auth/react";
import { useRouter }  from "next/navigation";
import { useEffect }  from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ResumoFinanceiro {
  receita_mes:   number;
  despesa_mes:   number;
  lucro_mes:     number;
  receita_hoje:  number;
}

export default function FinanceiroPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // RBAC: CAIXA não acessa financeiro
  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const { data } = useSWR<ResumoFinanceiro>(
    session?.user.role === "ADMIN" ? "/api/financeiro/resumo" : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  if (!data) return <p className="text-gray-600 text-sm">Carregando…</p>;

  const cards = [
    { label: "Receita do mês",  value: data.receita_mes,  icon: TrendingUp,   cor: "bg-emerald-500/15 text-emerald-400" },
    { label: "Despesas do mês", value: data.despesa_mes,  icon: TrendingDown, cor: "bg-red-500/15 text-red-400"         },
    { label: "Lucro do mês",    value: data.lucro_mes,    icon: DollarSign,   cor: "bg-brand-500/15 text-brand-400"     },
    { label: "Receita hoje",    value: data.receita_hoje, icon: TrendingUp,   cor: "bg-blue-500/15 text-blue-400"       },
  ];

  const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Financeiro</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, cor }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{fmtBRL(value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
