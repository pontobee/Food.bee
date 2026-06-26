/**
 * Worker autônomo para Railway (e qualquer ambiente sem Vercel Cron).
 *
 * Roda como processo Node.js separado e chama /api/worker/whatsapp
 * em loop contínuo. Configure como serviço no Railway com:
 *   Start command: node scripts/worker.mjs
 *
 * Variáveis de ambiente necessárias:
 *   APP_URL         URL pública do app Next.js  (ex: https://meuapp.railway.app)
 *   WORKER_SECRET   Mesmo valor definido no app (ex: abc123)
 *   WORKER_INTERVAL_MS  (opcional) padrão 60000 (1 minuto)
 */

const APP_URL  = process.env.APP_URL?.replace(/\/$/, "");
const SECRET   = process.env.WORKER_SECRET;
const INTERVAL = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

if (!APP_URL) { console.error("[worker] APP_URL não definido"); process.exit(1); }
if (!SECRET)  { console.error("[worker] WORKER_SECRET não definido"); process.exit(1); }

const endpoint = `${APP_URL}/api/worker/whatsapp`;

async function tick() {
  try {
    const res  = await fetch(endpoint, { headers: { Authorization: `Bearer ${SECRET}` } });
    const data = await res.json();

    if (!res.ok) {
      console.error(`[worker] ${ts()} HTTP ${res.status}:`, data);
      return;
    }

    if (data.processados > 0 || data.erros > 0) {
      console.log(`[worker] ${ts()} — processados: ${data.processados}, erros: ${data.erros}`);
    }
  } catch (err) {
    console.error(`[worker] ${ts()} — falha de rede:`, err.message);
  }
}

function ts() { return new Date().toISOString(); }

console.log(`[worker] iniciando | ${endpoint} | intervalo: ${INTERVAL}ms`);
tick();
setInterval(tick, INTERVAL);
