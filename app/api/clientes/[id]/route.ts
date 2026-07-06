import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lid    = session.user.lanchonete_id;

  const cliente = await prisma.cliente.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const pedidos = await prisma.pedido.findMany({
    where:   { cliente_id: id, lanchonete_id: lid, inativo_em: null },
    orderBy: { criado_em: "desc" },
    take:    15,
    select:  {
      id:              true,
      numero_pedido:   true,
      status:          true,
      total:           true,
      forma_pagamento: true,
      criado_em:       true,
    },
  });

  return NextResponse.json({
    id:            cliente.id,
    nome:          cliente.nome,
    telefone:      cliente.telefone,
    endereco:      cliente.endereco,
    total_pedidos: cliente.total_pedidos,
    total_gasto:   cliente.total_gasto.toNumber(),
    criado_em:     cliente.criado_em.toISOString(),
    pedidos: pedidos.map((p) => ({
      id:              p.id,
      numero_pedido:   p.numero_pedido,
      status:          p.status,
      total:           p.total.toNumber(),
      forma_pagamento: p.forma_pagamento,
      criado_em:       p.criado_em.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lid    = session.user.lanchonete_id;

  const cliente = await prisma.cliente.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body     = await req.json();
  const nome     = body.nome     !== undefined ? String(body.nome).trim().slice(0, 120)    : undefined;
  const telefone = body.telefone !== undefined ? String(body.telefone).trim().slice(0, 20) : undefined;
  const endereco = body.endereco !== undefined ? (body.endereco ? String(body.endereco).trim() : null) : undefined;

  if (nome !== undefined && !nome)     return NextResponse.json({ error: "Nome não pode ser vazio" },     { status: 400 });
  if (telefone !== undefined && !telefone) return NextResponse.json({ error: "Telefone não pode ser vazio" }, { status: 400 });

  if (telefone && telefone !== cliente.telefone) {
    const conflito = await prisma.cliente.findFirst({
      where: { lanchonete_id: lid, telefone, inativo_em: null, id: { not: id } },
    });
    if (conflito) return NextResponse.json({ error: "Telefone já usado por outro cliente" }, { status: 409 });
  }

  const atualizado = await prisma.cliente.update({
    where: { id },
    data:  {
      ...(nome     !== undefined ? { nome }     : {}),
      ...(telefone !== undefined ? { telefone } : {}),
      ...(endereco !== undefined ? { endereco } : {}),
    },
  });

  return NextResponse.json({
    id:            atualizado.id,
    nome:          atualizado.nome,
    telefone:      atualizado.telefone,
    endereco:      atualizado.endereco,
    total_pedidos: atualizado.total_pedidos,
    total_gasto:   atualizado.total_gasto.toNumber(),
    criado_em:     atualizado.criado_em.toISOString(),
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lid    = session.user.lanchonete_id;

  const cliente = await prisma.cliente.findFirst({
    where: { id, lanchonete_id: lid, inativo_em: null },
  });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.cliente.update({
    where: { id },
    data:  { inativo_em: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
