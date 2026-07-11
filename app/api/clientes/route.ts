import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/auth";
import { prisma } from "@/lib/prisma";

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lid  = session.user.lanchonete_id;
  const { searchParams } = req.nextUrl;

  const busca = searchParams.get("busca")?.trim() ?? "";
  const page  = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const where = {
    lanchonete_id: lid,
    inativo_em:    null,
    ...(busca
      ? {
          OR: [
            { nome:     { contains: busca, mode: "insensitive" as const } },
            { telefone: { contains: busca } },
          ],
        }
      : {}),
  };

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { total_gasto: "desc" },
      skip:    (page - 1) * PER_PAGE,
      take:    PER_PAGE,
    }),
    prisma.cliente.count({ where }),
  ]);

  return NextResponse.json({
    clientes: clientes.map((c) => ({
      id:            c.id,
      nome:          c.nome,
      telefone:      c.telefone,
      endereco:      c.endereco,
      total_pedidos: c.total_pedidos,
      total_gasto:   c.total_gasto.toNumber(),
      criado_em:     c.criado_em.toISOString(),
    })),
    total,
    paginas: Math.ceil(total / PER_PAGE) || 1,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lid  = session.user.lanchonete_id;
  const body = await req.json();

  const nome     = String(body.nome     ?? "").trim().slice(0, 120);
  const telefone = String(body.telefone ?? "").trim().slice(0, 20);
  const endereco = body.endereco ? String(body.endereco).trim() : null;

  if (!nome)     return NextResponse.json({ error: "Nome obrigatório" },     { status: 400 });
  if (!telefone) return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });

  const existente = await prisma.cliente.findFirst({
    where: { lanchonete_id: lid, telefone, inativo_em: null },
  });
  if (existente) {
    return NextResponse.json({ error: "Já existe um cliente com esse telefone" }, { status: 409 });
  }

  const cliente = await prisma.cliente.create({
    data: { lanchonete_id: lid, nome, telefone, endereco },
  });

  return NextResponse.json({
    id:            cliente.id,
    nome:          cliente.nome,
    telefone:      cliente.telefone,
    endereco:      cliente.endereco,
    total_pedidos: cliente.total_pedidos,
    total_gasto:   cliente.total_gasto.toNumber(),
    criado_em:     cliente.criado_em.toISOString(),
  }, { status: 201 });
}
