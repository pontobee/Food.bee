import { Client } from "pg";
import { logger }  from "@/lib/logger";

const MAX_DELAY_MS  = 30_000; // teto de 30s entre tentativas
const INITIAL_DELAY = 1_000;  // começa em 1s

/**
 * Abre uma conexão PG dedicada para LISTEN/NOTIFY com reconexão automática.
 *
 * - Se a conexão cair (error/end inesperado), tenta reconectar com backoff
 *   exponencial (1s → 2s → 4s … até 30s).
 * - Emite `retry: <ms>\n\n` via SSE a cada tentativa, sinalizando ao browser
 *   qual será o próximo intervalo de reconexão da sua parte.
 * - Para completamente quando o AbortSignal disparar (browser fechou a aba).
 *
 * Retorna uma função de cleanup — chamar encerra tudo imediatamente.
 */
export function createReconnectingNotifyClient(
  channel:     string,
  onNotify:    (payload: string) => void,
  onReconnect: (delayMs: number) => void,
  signal:      AbortSignal
): () => void {
  let current:    Client | null = null;
  let retryDelay: number        = INITIAL_DELAY;
  let stopped                   = false;

  async function connect() {
    if (stopped) return;

    try {
      const client = new Client({ connectionString: process.env.DIRECT_DATABASE_URL });
      await client.connect();
      await client.query(`LISTEN "${channel}"`);
      current    = client;
      retryDelay = INITIAL_DELAY; // reset no sucesso

      client.on("notification", (msg) => {
        if (msg.channel === channel && msg.payload) onNotify(msg.payload);
      });

      // Queda inesperada: erro ou encerramento pelo servidor
      const scheduleReconnect = () => {
        if (stopped) return;
        current = null;
        logger.warn("db-notify", `conexão caiu — reconectando em ${retryDelay}ms`, { channel });
        onReconnect(retryDelay);
        setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_DELAY_MS);
      };

      client.on("error", () => { try { client.end(); } catch {} scheduleReconnect(); });
      client.on("end",   () => { if (!stopped) scheduleReconnect(); });

    } catch (err) {
      if (stopped) return;
      logger.warn("db-notify", `falha ao conectar — tentando em ${retryDelay}ms`, err);
      onReconnect(retryDelay);
      setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_DELAY_MS);
    }
  }

  connect();

  const stop = () => {
    stopped = true;
    try { current?.end(); } catch {}
  };

  signal.addEventListener("abort", stop);
  return stop;
}
