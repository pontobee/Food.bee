"use client";

import { useSession }                    from "next-auth/react";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import { usePedidos }    from "@/hooks/usePedidos";
import { KanbanBoard }   from "@/components/pedidos/KanbanBoard";
import { NovoPedidoModal } from "@/components/pedidos/NovoPedidoModal";
import { useState }       from "react";

export default function PedidosPage() {
  const { data: session }       = useSession();
  const lanchoneteId            = session?.user?.lanchonete_id ?? "";
  const { data, error, isLoading, mutate } = usePedidos(lanchoneteId);
  const [abrirModal, setAbrirModal] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Barra superior */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.length} pedido{data.length !== 1 ? "s" : ""} hoje
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            className="btn-ghost"
            title="Atualizar"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setAbrirModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Novo pedido
          </button>
        </div>
      </div>

      {/* Kanban — ocupa o restante da altura */}
      <div className="flex-1 min-h-0">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-red-400 text-sm font-medium">Falha ao carregar pedidos</p>
            <button onClick={() => mutate()} className="btn-ghost text-xs">
              <RefreshCw size={13} />
              Tentar novamente
            </button>
          </div>
        ) : isLoading && data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Carregando…
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
            <p className="text-sm">Nenhum pedido aberto hoje.</p>
            <p className="text-xs">Clique em <strong className="text-gray-500">Novo pedido</strong> para começar.</p>
          </div>
        ) : (
          <KanbanBoard pedidos={data} onMutate={mutate} />
        )}
      </div>

      {abrirModal && (
        <NovoPedidoModal
          onClose={() => setAbrirModal(false)}
          onSalvo={() => { setAbrirModal(false); mutate(); }}
        />
      )}
    </div>
  );
}
