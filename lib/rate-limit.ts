const store = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000;

// Remove entradas expiradas a cada janela para evitar crescimento ilimitado
// do Map em servidores de longa duração. unref() evita que o timer prenda o
// processo caso seja o único recurso pendente (relevante para testes).
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, WINDOW_MS);
if (cleanup.unref) cleanup.unref();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}
