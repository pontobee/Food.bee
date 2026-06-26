import { NextResponse }        from "next/server";
import { auth }                from "@/auth";
import { adminGuard }          from "@/lib/auth-guards";
import { getResumoFinanceiro } from "@/modules/financeiro/financeiro.service";

// GET /api/financeiro/resumo — resumo financeiro do mês/dia (somente ADMIN)
export async function GET() {
  const session = await auth();
  const guard = adminGuard(session);
  if (guard) return guard;

  const resumo = await getResumoFinanceiro(session!.user.lanchonete_id);
  return NextResponse.json(resumo);
}
