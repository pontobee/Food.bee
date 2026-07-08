import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials                     from "next-auth/providers/credentials";
import bcrypt                          from "bcryptjs";
import { authConfig }    from "./auth.config";
import { prisma }        from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

class RateLimitError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // Chave composta IP+email: bloqueia força bruta por conta E por origem.
        // x-forwarded-for pode ter múltiplos IPs (proxy chain) — usamos o primeiro.
        const forwarded = request.headers.get("x-forwarded-for");
        const ip        = forwarded?.split(",")[0]?.trim()
                       ?? request.headers.get("x-real-ip")
                       ?? "unknown";

        const emailKey = `login:email:${credentials.email}`;
        const ipKey    = `login:ip:${ip}`;

        const { allowed: emailOk, retryAfterSeconds: emailWait } = checkRateLimit(emailKey);
        const { allowed: ipOk,    retryAfterSeconds: ipWait    } = checkRateLimit(ipKey);
        if (!emailOk || !ipOk) throw new RateLimitError(String(Math.max(emailWait, ipWait)));

        const usuario = await prisma.usuario.findFirst({
          where: { email: credentials.email as string, inativo_em: null },
          include: { lanchonete: { include: { assinatura: true } } },
        });

        if (!usuario?.senha_hash) return null;

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          usuario.senha_hash,
        );

        if (!senhaValida) return null;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimo_acesso_em: new Date() },
        });

        resetRateLimit(emailKey);
        resetRateLimit(ipKey);

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          lanchonete_id: usuario.lanchonete_id,
          lanchonete_nome: usuario.lanchonete.nome,
          role: usuario.role,
          assinatura_status: usuario.lanchonete.assinatura?.status ?? "TRIAL",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.lanchonete_id     = u.lanchonete_id;
        token.lanchonete_nome   = u.lanchonete_nome;
        token.role              = u.role as "ADMIN" | "CAIXA";
        token.assinatura_status = u.assinatura_status;
      }
      // Atualiza assinatura_status do DB quando a sessão é refreshada (ex: após pagamento)
      if (trigger === "update" && token.lanchonete_id) {
        const assinatura = await prisma.assinatura.findUnique({
          where: { lanchonete_id: token.lanchonete_id as string },
          select: { status: true },
        });
        if (assinatura) token.assinatura_status = assinatura.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id                = token.sub               as string;
      session.user.lanchonete_id     = token.lanchonete_id     as string;
      session.user.lanchonete_nome   = token.lanchonete_nome   as string;
      session.user.role              = token.role              as "ADMIN" | "CAIXA";
      session.user.assinatura_status = token.assinatura_status as string;
      return session;
    },
  },
});
