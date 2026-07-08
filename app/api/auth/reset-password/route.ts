import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";
import bcrypt                        from "bcryptjs";
import { prisma }                    from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function POST(req: NextRequest) {
  let body: { token?: string; senha?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { token, senha } = body;
  if (!token) return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: "A senha precisa ter ao menos 6 caracteres" }, { status: 400 });
  }

  let payload: { userId: string };
  try {
    const result = await jwtVerify(token, secret);
    payload = result.payload as { userId: string };
  } catch {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: payload.userId, inativo_em: null },
  });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const senha_hash = await bcrypt.hash(senha, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data:  { senha_hash },
  });

  return NextResponse.json({ ok: true });
}
