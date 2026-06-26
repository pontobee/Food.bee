// Níveis em ordem crescente de severidade.
// LOG_LEVEL=warn → só warn e error aparecem (padrão de produção).
// LOG_LEVEL=debug → todos os níveis (útil em desenvolvimento local).
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

function resolveLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return (raw in LEVELS ? raw : "info") as Level;
}

const minLevel = LEVELS[resolveLevel()];

function log(level: Level, context: string, message: string, meta?: unknown) {
  if (LEVELS[level] < minLevel) return;

  const entry = {
    ts:      new Date().toISOString(),
    level,
    context,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") console.error(line);
  else if (level === "warn")  console.warn(line);
  else                        console.log(line);
}

export const logger = {
  debug: (ctx: string, msg: string, meta?: unknown) => log("debug", ctx, msg, meta),
  info:  (ctx: string, msg: string, meta?: unknown) => log("info",  ctx, msg, meta),
  warn:  (ctx: string, msg: string, meta?: unknown) => log("warn",  ctx, msg, meta),
  error: (ctx: string, msg: string, meta?: unknown) => log("error", ctx, msg, meta),
};
