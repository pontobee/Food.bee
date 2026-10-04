"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

function iniciais(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const { data: session } = useSession();

  const nome       = session?.user?.name ?? "—";
  const role       = session?.user?.role ?? "CAIXA";
  const lanchonete = session?.user?.lanchonete_nome ?? "";

  return (
    <header className="h-14 shrink-0 flex items-center justify-between
                       px-4 md:px-6 border-b border-dark-500/50 bg-dark-900">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm font-medium text-dark-100 truncate">{lanchonete}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-dark-100 leading-none">{nome}</p>
          <p className="text-[11px] text-dark-300 mt-0.5 tracking-wide">{role}</p>
        </div>

        <div
          aria-hidden
          className="w-8 h-8 rounded-lg bg-dark-600 text-dark-200 text-xs font-semibold
                     flex items-center justify-center shrink-0"
        >
          {iniciais(nome)}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost px-2 text-dark-200 hover:text-red-400"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
