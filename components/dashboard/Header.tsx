"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { data: session } = useSession();

  const nome      = session?.user?.name ?? "—";
  const role      = session?.user?.role ?? "CAIXA";
  const lanchonete = session?.user?.lanchonete_nome ?? "";

  return (
    <header className="h-16 shrink-0 flex items-center justify-between
                       px-4 md:px-6 border-b border-dark-600 bg-dark-800">
      {/* Esquerda: hambúrguer (mobile) + nome da lanchonete */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenMenu}
          className="md:hidden btn-ghost px-2 text-gray-400 hover:text-white shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <p className="text-sm font-medium text-white truncate">{lanchonete}</p>
      </div>

      {/* Usuário */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-none">{nome}</p>
          <p className="text-xs text-gray-500 mt-0.5">{role}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost px-2 text-gray-400 hover:text-red-400"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
