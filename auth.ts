import NextAuth      from "next-auth";
import Credentials   from "next-auth/providers/credentials";
import bcrypt        from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma }    from "@/lib/prisma";

// Config completa (Node.js runtime only — nunca importada pelo middleware)
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email", type: "email"    },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

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
          data:  { ultimo_acesso_em: new Date() },
        });

        return {
          id:                usuario.id,
          name:              usuario.nome,
          email:             usuario.email,
          lanchonete_id:     usuario.lanchonete_id,
          lanchonete_nome:   usuario.lanchonete.nome,
          role:              usuario.role,
          assinatura_status: usuario.lanchonete.assinatura?.status ?? "TRIAL",
        };
      },
    }),
  ],
});
