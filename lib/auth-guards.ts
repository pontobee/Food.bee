import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * Retorna um NextResponse de erro se a sessão for inválida ou a assinatura
 * estiver inadimplente. Retorna null quando tudo está OK — o chamador pode
 * continuar sabendo que session não é null e a assinatura está ativa.
 *
 * Uso:
 *   const session = await auth();
 *   const guard = authGuard(session);
 *   if (guard) return guard;
 */
export function authGuard(session: Session | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.assinatura_status === "INADIMPLENTE") {
    return NextResponse.json(
      { error: "Assinatura inadimplente. Regularize em /planos." },
      { status: 402 }
    );
  }
  return null;
}

/** Igual a authGuard, mas exige role ADMIN. */
export function adminGuard(session: Session | null): NextResponse | null {
  const base = authGuard(session);
  if (base) return base;
  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
