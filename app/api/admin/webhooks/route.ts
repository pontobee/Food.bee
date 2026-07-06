import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { adminGuard }   from "@/lib/auth-guards";
import { prisma }       from "@/lib/prisma";

// GET /api/admin/webhooks — lista eventos PENDENTE e ERRO do tenant (somente ADMIN)
// Permite diagnóstico de fila travada sem acesso direto ao banco.
export async function GET() {
  const session = await auth();
  const guard = adminGuard(session);
  if (guard) return guard;

  const eventos = await prisma.webhookEvento.findMany({
    where: {
      lanchonete_id: session!.user.lanchonete_id,
      status: { in: ["PENDENTE", "ERRO"] },
    },
    select: {
      id:            true,
      id_externo:    true,
      status:        true,
      tentativas:    true,
      erro_mensagem: true,
      recebido_em:   true,
      processado_em: true,
    },
    orderBy: { recebido_em: "asc" },
    take: 50,
  });

  return NextResponse.json({
    total:   eventos.length,
    eventos,
  });
}
