"use client";

import useSWR       from "swr";
import { useEffect } from "react";
import type { PedidoDTO, StatusPedido } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePedidos(lanchoneteId: string) {
  const { data, error, isLoading, mutate } = useSWR<PedidoDTO[]>(
    lanchoneteId ? `/api/pedidos` : null,
    fetcher,
    {
      refreshInterval: 0,          // SSE cuida das atualizações
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      fallbackData: [],
    }
  );

  // SSE — recebe notificações do pg_notify e revalida o cache SWR
  useEffect(() => {
    if (!lanchoneteId) return;

    const es = new EventSource(`/api/events/${lanchoneteId}`);

    es.addEventListener("pedido", () => {
      mutate(); // re-fetch silencioso
    });

    es.onerror = () => es.close();

    return () => es.close();
  }, [lanchoneteId, mutate]);

  const pedidosPorStatus = (status: StatusPedido) =>
    (data ?? []).filter((p) => p.status === status);

  return { data: data ?? [], error, isLoading, mutate, pedidosPorStatus };
}

export async function atualizarStatus(id: string, status: StatusPedido) {
  const res = await fetch(`/api/pedidos/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar pedido");
  return res.json();
}
