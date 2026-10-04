"use client";

import useSWR from "swr";
import {
  AreaChart, Area,
  BarChart,  Bar,
  PieChart,  Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartsData {
  faturamento7d: { name: string; receita: number; pedidos: number }[];
  top5Produtos:  { nome: string; quantidade: number }[];
  pagamentos:    { name: string; value: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GRID_COLOR      = "#252828";
const AXIS_COLOR      = "#6F7470";
const TOOLTIP_STYLE   = {
  backgroundColor: "#171919",
  border:          "1px solid #252828",
  borderRadius:    8,
  color:           "#F5F5F0",
  fontSize:        12,
};
const PIE_COLORS = ["#D4A017", "#3b82f6", "#10b981", "#6F7470"];

function FaturamentoChart({ data }: { data: ChartsData["faturamento7d"] }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-dark-100 mb-4">Faturamento — últimos 7 dias</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
            width={52}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`R$ ${v.toFixed(2).replace(".", ",")}`, "Receita"]}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradReceita)"
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProdutosChart({ data }: { data: ChartsData["top5Produtos"] }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-dark-100 mb-4">Top 5 produtos</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="nome"
            width={90}
            tick={{ fill: "#F5F5F0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [v, "Vendidos"]}
          />
          <Bar dataKey="quantidade" fill="#D4A017" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PagamentosChart({ data }: { data: ChartsData["pagamentos"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-dark-100 mb-4">Formas de pagamento</p>
      {total === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Sem dados</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`${v} pedidos`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-2 flex-1">
            {data.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {d.name}
                </span>
                <span className="text-white font-medium">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChartsBI() {
  const { data, isLoading } = useSWR<ChartsData>("/api/dashboard/charts", fetcher, {
    refreshInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-[260px] animate-pulse bg-dark-700" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-medium text-dark-300 uppercase tracking-[0.14em]">
        Análise — últimos 7 dias
      </h2>
      <FaturamentoChart data={data.faturamento7d} />
      <div className="grid gap-3 md:grid-cols-2">
        <TopProdutosChart data={data.top5Produtos} />
        <PagamentosChart  data={data.pagamentos}   />
      </div>
    </div>
  );
}
