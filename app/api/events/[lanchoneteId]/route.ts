import { NextRequest }                         from "next/server";
import { auth }                               from "@/auth";
import { createReconnectingNotifyClient }     from "@/lib/db-notify";
import { authGuard }                          from "@/lib/auth-guards";

// GET /api/events/[lanchoneteId] — SSE para o Kanban
// Mantém conexão longa aberta; pg_notify dispara a cada mudança de status.
// Reconexão automática: se o PG cair, o cliente PG tenta reconectar com
// backoff exponencial e o browser recebe retry: <ms> para se sincronizar.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lanchoneteId: string }> }
) {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return new Response(guard.statusText ?? "Unauthorized", { status: guard.status });

  const { lanchoneteId } = await params;

  if (session!.user.lanchonete_id !== lanchoneteId) {
    return new Response("Forbidden", { status: 403 });
  }

  const channel = `pedido_status_${lanchoneteId}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try { controller.enqueue(encoder.encode(data)); } catch {}
      };

      // Heartbeat a cada 25s — proxies cortam idle connections sem tráfego
      const hb = setInterval(() => enqueue(": heartbeat\n\n"), 25_000);

      createReconnectingNotifyClient(
        channel,
        (payload)  => enqueue(`event: pedido\ndata: ${payload}\n\n`),
        (delayMs)  => enqueue(`retry: ${delayMs}\n\n`),
        req.signal
      );

      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
