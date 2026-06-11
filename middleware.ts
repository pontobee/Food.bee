import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware usa APENAS a config leve (sem pg/prisma) → compatível com Edge Runtime
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
