import { NextRequest, NextResponse } from "next/server";
import { SignJWT }                   from "jose";
import { Resend }                    from "resend";
import { prisma }                    from "@/lib/prisma";

const resend   = new Resend(process.env.RESEND_API_KEY);
const secret   = new TextEncoder().encode(process.env.AUTH_SECRET!);
const FROM     = process.env.RESEND_FROM ?? "LancheSmart <noreply@lanchesmart.com.br>";
const APP_URL  = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

  // Sempre retorna 200 para não revelar se o e-mail existe (segurança)
  const usuario = await prisma.usuario.findFirst({
    where: { email, inativo_em: null },
    select: { id: true, nome: true, lanchonete_id: true },
  });

  if (usuario && process.env.RESEND_API_KEY) {
    const token = await new SignJWT({ userId: usuario.id, email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(secret);

    const link = `${APP_URL}/reset-password/${encodeURIComponent(token)}`;

    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: "Redefinir senha — LancheSmart",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#111;margin-bottom:8px">Redefinir sua senha</h2>
          <p style="color:#555">Olá, ${usuario.nome}. Recebemos uma solicitação para redefinir a senha da sua conta no LancheSmart.</p>
          <p style="color:#555">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${link}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Redefinir senha
          </a>
          <p style="color:#999;font-size:12px">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
