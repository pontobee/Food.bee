import { defineConfig, env } from "prisma/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// CLI do Prisma não lê .env.local automaticamente (isso é convenção do Next.js)
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// Prisma 7+: URLs de conexão saem do schema.prisma e vão aqui.
// DATABASE_URL        → pool (PgBouncer) — usado pelo PrismaClient em runtime
// DIRECT_DATABASE_URL → conexão direta  — usado pelo Migrate (DDL não passa por pool)
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_DATABASE_URL"),
  },
});
