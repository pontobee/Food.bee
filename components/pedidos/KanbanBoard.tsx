"use client";

import { PedidoCard }  from "./PedidoCard";
import type { PedidoDTO, StatusPedido } from "@/types";

const COLUNAS: { status: StatusPedido; label: string; cor: string }[] = [
  { status: "AGUARDANDO", label: "Aguardando",  cor: "border-t-blue-500"   },
  { status: "EM_PREPARO", label: "Em Preparo",  cor: "border-t-amber-500"  },
  { status: "PRONTO",     label: "Pronto",      cor: "border-t-emerald-500"},
  { status: "ENTREGUE",   label: "Entregue",    cor: "border-t-gray-500"   },
  { status: "CANCELADO",  label: "Cancelado",   cor: "border-t-red-500"    },
];

interface Props {
  pedidos:  PedidoDTO[];
  onMutate: () => void;
}

export function KanbanBoard({ pedidos, onMutate }: Props) {
  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {COLUNAS.map(({ status, label, cor }) => {
        const cards = pedidos.filter((p) => p.status === status);

        return (
          <section
            key={status}
            className={`flex flex-col w-72 shrink-0 bg-dark-800 border border-dark-600
                        border-t-2 ${cor} rounded-xl overflow-hidden`}
          >
            {/* Cabeçalho da coluna */}
            <header className="flex items-center justify-between px-3 py-2.5 border-b border-dark-600">
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs bg-dark-700 text-gray-400 font-mono
                               px-1.5 py-0.5 rounded">
                {cards.length}
              </span>
            </header>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {cards.length === 0 && (
                <p className="text-xs text-gray-600 text-center mt-6">
                  Nenhum pedido
                </p>
              )}
              {cards.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} onMutate={onMutate} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
