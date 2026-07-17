"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, ChevronDown } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  CAIXA: "Operador",
  COZINHA: "Cozinha",
};

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { data: session } = useSession();

  const nome       = session?.user?.name ?? "—";
  const role       = session?.user?.role ?? "CAIXA";
  const lanchonete = session?.user?.lanchonete_nome ?? "";
  const initials   = nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className="h-16 shrink-0 flex items-center justify-between
                 px-4 md:px-6 border-b border-dark-600/60
                 bg-dark-800/80 backdrop-blur-md sticky top-0 z-30"
    >
      {/* Esquerda */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          className="md:hidden btn-ghost px-2 text-gray-400 hover:text-white shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        {lanchonete && (
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-white truncate leading-none">
              {lanchonete}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">{ROLE_LABEL[role] ?? role}</p>
          </div>
        )}
      </div>

      {/* Direita — usuário */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-dark-700/70 transition-colors duration-150 cursor-pointer group">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0 text-[11px] font-bold text-white shadow-glow-sm">
            {initials || "?"}
          </div>
          {/* Nome */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{nome}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{ROLE_LABEL[role] ?? role}</p>
          </div>
          <ChevronDown size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors hidden sm:block" />
        </div>

        <div className="w-px h-5 bg-dark-600" />

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost px-2.5 text-gray-500 hover:text-red-400"
          title="Sair do sistema"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
