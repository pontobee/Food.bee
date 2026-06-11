import { NextRequest }          from "next/server";
import { auth }                 from "@/auth";
import { createNotifyClient }   from "@/lib/db-notify";

// GET /api/events/[lanchoneteId] — SSE para o Kanban
// Mantém conexão longa aberta; pg_notify dispara a cada mudança de status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lanchoneteId: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { lanchoneteId } = await params;

  // Garante que o tenant só assiste o próprio canal
  if (session.user.lanchonete_id !== lanchoneteId) {
    return new Response("Forbidden", { status: 403 });
  }

  const channel = `pedido_status_${lanchoneteId}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat a cada 25s para manter conexão viva (proxies cortam idle)
      const hb = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25_000);

      const client = await createNotifyClient(channel, (payload) => {
        controller.enqueue(encoder.encode(`event: pedido\ndata: ${payload}\n\n`));
      });

      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        client.end();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // Nginx: desativa buffer para SSE
    },
  });
}
