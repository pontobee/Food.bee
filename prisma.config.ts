import { defineConfig } from "prisma/config";

// Prisma 7+: URLs de conexão saem do schema.prisma e vão aqui.
// DATABASE_URL        → pool (PgBouncer) — usado pelo PrismaClient em runtime
// DIRECT_DATABASE_URL → conexão direta  — usado pelo Migrate (DDL não passa por pool)
export default defineConfig({
  schema: "prisma/schema.prisma",
});
