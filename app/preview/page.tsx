import {
  ShoppingBag, DollarSign, TrendingUp, AlertTriangle,
  Clock, CheckCircle2, XCircle,
} from "lucide-react";

const STATS = [
  { icon: ShoppingBag,   label: "Pedidos hoje",    value: "23",         cor: "bg-blue-500/15 text-blue-400"    },
  { icon: DollarSign,    label: "Faturamento",      value: "R$ 847,30",  cor: "bg-emerald-500/15 text-emerald-400" },
  { icon: TrendingUp,    label: "Ticket médio",     value: "R$ 36,84",   cor: "bg-brand-500/15 text-brand-400"  },
  { icon: AlertTriangle, label: "Estoque crítico",  value: "2",          cor: "bg-red-500/15 text-red-400"      },
];

const ULTIMOS = [
  { num: 23, cliente: "João Silva",    total: "R$ 52,80", status: "EM_PREPARO", forma: "PIX"      },
  { num: 22, cliente: "Maria Santos",  total: "R$ 29,90", status: "PRONTO",     forma: "Débito"   },
  { num: 21, cliente: "Cliente balcão",total: "R$ 44,50", status: "ENTREGUE",   forma: "Dinheiro" },
  { num: 20, cliente: "Ana Lima",      total: "R$ 67,20", status: "ENTREGUE",   forma: "PIX"      },
];

const STATUS_STYLE: Record<string, string> = {
  AGUARDANDO: "bg-blue-500/15 text-blue-400",
  EM_PREPARO: "bg-amber-500/15 text-amber-400",
  PRONTO:     "bg-emerald-500/15 text-emerald-400",
  ENTREGUE:   "bg-gray-500/15 text-gray-400",
  CANCELADO:  "bg-red-500/15 text-red-400",
};

export default function PreviewDashboard() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-white">Visão Geral</h1>
        <p className="text-sm text-gray-500 mt-0.5">Segunda-feira, 09 de junho de 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ icon: Icon, label, value, cor }) => (
          <div key={label} className="bg-dark-800 border border-dark-600 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-600 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Últimos pedidos</h2>
          <a href="/preview/pedidos"
             className="text-xs text-brand-400 hover:underline">Ver Kanban →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600/50">
              <th className="px-5 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Nº</th>
              <th className="px-5 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Cliente</th>
              <th className="px-5 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Pagamento</th>
              <th className="px-5 py-2.5 text-right text-xs text-gray-500 font-semibold uppercase">Total</th>
              <th className="px-5 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {ULTIMOS.map((p) => (
              <tr key={p.num} className="border-b border-dark-600/30 hover:bg-dark-700 transition-colors">
                <td className="px-5 py-3 font-bold text-white">#{p.num}</td>
                <td className="px-5 py-3 text-gray-300">{p.cliente}</td>
                <td className="px-5 py-3 text-gray-400">{p.forma}</td>
                <td className="px-5 py-3 text-right font-semibold text-white">{p.total}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status do sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Banco de dados",  ok: true },
          { label: "WhatsApp (Evol. API)", ok: false },
          { label: "Gateway de pagamento", ok: true },
        ].map(({ label, ok }) => (
          <div key={label} className="bg-dark-800 border border-dark-600 rounded-xl p-4
                                      flex items-center gap-3">
            {ok
              ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              : <XCircle      size={16} className="text-red-400 shrink-0" />}
            <span className="text-sm text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
