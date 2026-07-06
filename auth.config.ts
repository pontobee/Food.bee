import type { NextAuthConfig } from "next-auth";

// Config leve — sem imports de Node.js (pg, crypto, prisma).
// Usada APENAS pelo middleware (Edge Runtime).
// A config completa com Credentials + Prisma está em auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/api/signup") ||
        pathname.startsWith("/api/auth/forgot-password") ||
        pathname.startsWith("/api/auth/reset-password") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/eventos") ||
        pathname.startsWith("/api/public/") ||
        pathname.startsWith("/api/webhooks/") ||
        pathname.startsWith("/cardapio/") ||
        pathname.startsWith("/preview");

      if (isPublic) return true;
      if (!isLoggedIn) return false;

      // Inadimplente só acessa /planos
      const status = auth?.user?.assinatura_status;
      if (status === "INADIMPLENTE" && !pathname.startsWith("/planos")) {
        return Response.redirect(new URL("/planos", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
