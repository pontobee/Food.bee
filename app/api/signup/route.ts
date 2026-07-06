import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 55);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const exists = await prisma.lanchonete.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function POST(req: NextRequest) {
  let body: {
    nome_lanchonete?: string;
    nome_usuario?: string;
    email?: string;
    senha?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nome_lanchonete = body.nome_lanchonete?.trim();
  const nome_usuario    = body.nome_usuario?.trim();
  const email           = body.email?.trim().toLowerCase();
  const senha           = body.senha;

  if (!nome_lanchonete || nome_lanchonete.length < 2)
    return NextResponse.json({ error: "Nome do estabelecimento inválido" }, { status: 400 });
  if (!nome_usuario || nome_usuario.length < 2)
    return NextResponse.json({ error: "Seu nome é obrigatório" }, { status: 400 });
  if (!email || !EMAIL_REGEX.test(email))
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  if (!senha || senha.length < 6)
    return NextResponse.json({ error: "A senha precisa ter ao menos 6 caracteres" }, { status: 400 });

  const slug       = await uniqueSlug(toSlug(nome_lanchonete));
  const senha_hash = await bcrypt.hash(senha, 10);
  const agora      = new Date();
  const vencimento = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 dias de trial

  await prisma.$transaction(async (tx) => {
    const lanchonete = await tx.lanchonete.create({
      data: { nome: nome_lanchonete, slug },
    });

    await tx.usuario.create({
      data: {
        lanchonete_id: lanchonete.id,
        nome: nome_usuario,
        email,
        senha_hash,
        role: "ADMIN",
      },
    });

    await tx.assinatura.create({
      data: {
        lanchonete_id:  lanchonete.id,
        plano:          "TRIAL",
        status:         "TRIAL",
        data_inicio:    agora,
        data_vencimento: vencimento,
        valor_mensal:   0,
      },
    });

    await tx.pedidoSeq.create({
      data: { lanchonete_id: lanchonete.id, seq: 0 },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
