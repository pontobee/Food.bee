import { NextRequest, NextResponse }              from "next/server";
import { auth }                                    from "@/auth";
import { atualizarTaxa, desativarTaxa, TaxaInput } from "@/modules/delivery/delivery.service";

// PUT /api/delivery/taxas/[id] — atualiza zona (ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await req.json() as Partial<TaxaInput>;

  try {
    const taxa = await atualizarTaxa(id, body, session.user.lanchonete_id);
    return NextResponse.json(taxa);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

// DELETE /api/delivery/taxas/[id] — desativa zona (ADMIN)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    await desativarTaxa(id, session.user.lanchonete_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}
