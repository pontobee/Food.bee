import { NextRequest, NextResponse }   from "next/server";
import { auth }                        from "@/auth";
import { getPixConfig, salvarPixConfig } from "@/modules/pix/pix.service";

// GET /api/configuracoes/pix — retorna status da config (sem expor o token)
export async function GET() {
  const session = await auth();
  if (!session)                        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")   return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await getPixConfig(session.user.lanchonete_id);
  return NextResponse.json(data ?? { configurado: false });
}

// PUT /api/configuracoes/pix — salva ou atualiza o access_token MP
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)                        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")   return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { access_token } = await req.json() as { access_token?: string };
  if (!access_token?.trim())
    return NextResponse.json({ error: "access_token obrigatório" }, { status: 400 });

  await salvarPixConfig(session.user.lanchonete_id, access_token.trim());
  return NextResponse.json({ ok: true });
}
