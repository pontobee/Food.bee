import { NextRequest, NextResponse }        from "next/server";
import { auth }                             from "@/auth";
import { listarTaxas, criarTaxa, TaxaInput } from "@/modules/delivery/delivery.service";

// GET /api/delivery/taxas — lista zonas ativas do tenant
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taxas = await listarTaxas(session.user.lanchonete_id);
  return NextResponse.json(taxas);
}

// POST /api/delivery/taxas — cria nova zona (ADMIN only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Partial<TaxaInput>;
  if (!body.nome?.trim() || body.taxa == null || body.taxa < 0)
    return NextResponse.json({ error: "nome e taxa são obrigatórios" }, { status: 400 });

  const taxa = await criarTaxa(body as TaxaInput, session.user.lanchonete_id);
  return NextResponse.json(taxa, { status: 201 });
}
