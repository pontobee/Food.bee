type Level = "info" | "warn" | "error";

function log(level: Level, context: string, message: string, meta?: unknown) {
  const prefix = `[${context}]`;
  if (level === "error") console.error(prefix, message, meta ?? "");
  else if (level === "warn")  console.warn(prefix,  message, meta ?? "");
  else                        console.log(prefix,   message, meta ?? "");
}

export const logger = {
  info:  (ctx: string, msg: string, meta?: unknown) => log("info",  ctx, msg, meta),
  warn:  (ctx: string, msg: string, meta?: unknown) => log("warn",  ctx, msg, meta),
  error: (ctx: string, msg: string, meta?: unknown) => log("error", ctx, msg, meta),
};
