import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lid = session.user.lanchonete_id;
  const { searchParams } = req.nextUrl;

  const inicio    = searchParams.get("inicio");
  const fim       = searchParams.get("fim");
  const tipo      = searchParams.get("tipo") as "RECEITA" | "DESPESA" | null;
  const categoria = searchParams.get("categoria");
  const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPage   = 20;

  const where = {
    lanchonete_id: lid,
    inativo_em:    null,
    ...(tipo      ? { tipo }                                : {}),
    ...(categoria ? { categoria }                           : {}),
    ...(inicio || fim ? {
      data: {
        ...(inicio ? { gte: new Date(inicio) } : {}),
        ...(fim    ? { lte: new Date(fim + "T23:59:59") } : {}),
      },
    } : {}),
  };

  const [transacoes, total] = await Promise.all([
    prisma.transacao.findMany({
      where,
      orderBy: { data: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
      include: { usuario: { select: { nome: true } } },
    }),
    prisma.transacao.count({ where }),
  ]);

  return NextResponse.json({
    transacoes: transacoes.map((t) => ({
      id:           t.id,
      tipo:         t.tipo,
      categoria:    t.categoria,
      descricao:    t.descricao,
      valor:        t.valor.toNumber(),
      data:         t.data.toISOString(),
      pedido_id:    t.pedido_id,
      usuario_nome: t.usuario.nome,
      criado_em:    t.criado_em.toISOString(),
    })),
    total,
    paginas: Math.ceil(total / perPage),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lid = session.user.lanchonete_id;
  const uid = session.user.id;

  const body = await req.json();
  const { tipo, categoria, descricao, valor, data } = body;

  if (!tipo || !categoria || !descricao || !valor) {
    return NextResponse.json({ error: "Campos obrigatórios: tipo, categoria, descricao, valor" }, { status: 400 });
  }
  if (tipo !== "RECEITA" && tipo !== "DESPESA") {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  if (typeof valor !== "number" || valor <= 0) {
    return NextResponse.json({ error: "valor deve ser positivo" }, { status: 400 });
  }

  const transacao = await prisma.transacao.create({
    data: {
      lanchonete_id: lid,
      usuario_id:    uid,
      tipo,
      categoria:     String(categoria).trim().slice(0, 60),
      descricao:     String(descricao).trim(),
      valor,
      data:          data ? new Date(data) : new Date(),
    },
    include: { usuario: { select: { nome: true } } },
  });

  return NextResponse.json({
    id:           transacao.id,
    tipo:         transacao.tipo,
    categoria:    transacao.categoria,
    descricao:    transacao.descricao,
    valor:        transacao.valor.toNumber(),
    data:         transacao.data.toISOString(),
    pedido_id:    transacao.pedido_id,
    usuario_nome: transacao.usuario.nome,
    criado_em:    transacao.criado_em.toISOString(),
  }, { status: 201 });
}
