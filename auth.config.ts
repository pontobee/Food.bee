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
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/eventos") ||
        pathname.startsWith("/preview");

      if (isPublic) return true;
      if (!isLoggedIn) return false;

      // Inadimplente só acessa /planos
      const status = (auth?.user as Record<string, unknown>)?.assinatura_status as string;
      if (status === "INADIMPLENTE" && !pathname.startsWith("/planos")) {
        return Response.redirect(new URL("/planos", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.lanchonete_id     = u.lanchonete_id;
        token.lanchonete_nome   = u.lanchonete_nome;
        token.role              = u.role as "ADMIN" | "CAIXA";
        token.assinatura_status = u.assinatura_status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.lanchonete_id     = token.lanchonete_id     as string;
      session.user.lanchonete_nome   = token.lanchonete_nome   as string;
      session.user.role              = token.role              as "ADMIN" | "CAIXA";
      session.user.assinatura_status = token.assinatura_status as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
