// ── Interface da store ────────────────────────────────────────────────────────
// Permite trocar a implementação in-memory por Redis sem alterar os callers.
// Para ativar Redis: defina REDIS_URL e a RedisStore entra automaticamente.
export interface RateLimitStore {
  check(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number };
  reset(key: string): void;
}

// ── Implementação in-memory (MapStore) ────────────────────────────────────────
// Funciona em instância única. Para multi-instância, usar RedisStore abaixo.
class MapStore implements RateLimitStore {
  private readonly map = new Map<string, { count: number; resetAt: number }>();

  constructor(windowMs: number) {
    // Remove entradas expiradas a cada janela — evita crescimento ilimitado
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.map) {
        if (now > v.resetAt) this.map.delete(k);
      }
    }, windowMs);
    if (timer.unref) timer.unref();
  }

  check(key: string, maxAttempts: number, windowMs: number) {
    const now   = Date.now();
    const entry = this.map.get(key);

    if (!entry || now > entry.resetAt) {
      this.map.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (entry.count >= maxAttempts) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  reset(key: string) {
    this.map.delete(key);
  }
}

// ── Configuração ──────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 min

// Escolhe a store com base em REDIS_URL.
// RedisStore é um placeholder — implementação real virá quando Redis for provisionado.
// Por enquanto, qualquer REDIS_URL definida ainda usa MapStore (log de aviso emitido).
function buildStore(): RateLimitStore {
  if (process.env.REDIS_URL) {
    // TODO: substituir por RedisStore quando o pacote ioredis for adicionado.
    // Importar dinamicamente para não quebrar ambientes sem Redis.
    console.warn("[rate-limit] REDIS_URL definido mas RedisStore não implementada — usando MapStore");
  }
  return new MapStore(WINDOW_MS);
}

const store = buildStore();

// ── API pública ───────────────────────────────────────────────────────────────
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  return store.check(key, MAX_ATTEMPTS, WINDOW_MS);
}

export function resetRateLimit(key: string): void {
  store.reset(key);
}
