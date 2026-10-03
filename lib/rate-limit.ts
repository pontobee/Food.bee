import Redis from 'ioredis';

// ── Interface da store ────────────────────────────────────────────────────────
// Permite trocar a implementação in-memory por Redis sem alterar os callers.
export interface RateLimitStore {
  check(key: string, maxAttempts: number, windowMs: number): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  reset(key: string): Promise<void>;
}

// ── Implementação in-memory (MapStore) ────────────────────────────────────────
class MapStore implements RateLimitStore {
  private readonly map = new Map<string, { count: number; resetAt: number }>();

  constructor(windowMs: number) {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.map) {
        if (now > v.resetAt) this.map.delete(k);
      }
    }, windowMs);
    if (timer.unref) timer.unref();
  }

  async check(key: string, maxAttempts: number, windowMs: number) {
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

  async reset(key: string) {
    this.map.delete(key);
  }
}

// ── Implementação Redis (RedisStore) ──────────────────────────────────────────
class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url);
  }

  async check(key: string, maxAttempts: number, windowMs: number) {
    try {
      const multi = this.redis.multi();
      multi.incr(key);
      multi.pttl(key);
      
      const results = await multi.exec();
      if (!results) return { allowed: true, retryAfterSeconds: 0 };
      
      const count = results[0][1] as number;
      let pttl = results[1][1] as number;
      
      if (count === 1 || pttl === -1) {
        await this.redis.pexpire(key, windowMs);
        pttl = windowMs;
      }
      
      if (count > maxAttempts) {
        return { allowed: false, retryAfterSeconds: Math.ceil(pttl / 1000) };
      }
      
      return { allowed: true, retryAfterSeconds: 0 };
    } catch (err) {
      console.error("[rate-limit] Erro no RedisStore:", err);
      return { allowed: true, retryAfterSeconds: 0 }; // Falha aberta em caso de erro no Redis
    }
  }

  async reset(key: string) {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error("[rate-limit] Erro no reset do RedisStore:", err);
    }
  }
}

// ── Configuração ──────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 min

let storeInstance: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (storeInstance) return storeInstance;

  if (process.env.REDIS_URL) {
    storeInstance = new RedisStore(process.env.REDIS_URL);
    console.info("[rate-limit] Usando RedisStore para limite de requisições.");
  } else {
    storeInstance = new MapStore(WINDOW_MS);
    console.warn("[rate-limit] REDIS_URL não definido — usando MapStore in-memory (Não recomendado para multi-instância)");
  }

  return storeInstance;
}

// ── API pública ───────────────────────────────────────────────────────────────
export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return getStore().check(key, MAX_ATTEMPTS, WINDOW_MS);
}

export async function resetRateLimit(key: string): Promise<void> {
  return getStore().reset(key);
}
