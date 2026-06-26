import { NextResponse }      from "next/server";
import { auth }              from "@/auth";
import { authGuard }         from "@/lib/auth-guards";
import { getDashboardStats } from "@/modules/dashboard/dashboard.service";

// GET /api/dashboard/stats — métricas do dia para o painel principal
export async function GET() {
  const session = await auth();
  const guard = authGuard(session);
  if (guard) return guard;

  const stats = await getDashboardStats(session!.user.lanchonete_id);
  return NextResponse.json(stats);
}
