"use client";

import Link             from "next/link";
import { usePathname }  from "next/navigation";
import { useSession }   from "next-auth/react";
import {
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  Package,
  BookOpen,
  DollarSign,
  MessageSquare,
  Users,
  Contact,
  Settings,
} from "lucide-react";

// `adminOnly` marca rotas que só ADMIN enxerga (ex.: gestão de equipe).
const NAV = [
  { href: "/dashboard",               label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/pedidos",       label: "Pedidos",     icon: ClipboardList   },
  { href: "/dashboard/produtos",      label: "Cardápio",    icon: BookOpen,      adminOnly: true },
  { href: "/dashboard/estoque",       label: "Estoque",     icon: Package         },
  { href: "/dashboard/financeiro",    label: "Financeiro",  icon: DollarSign,   adminOnly: true },
  { href: "/dashboard/clientes",      label: "Clientes",    icon: Contact,       adminOnly: true },
  { href: "/dashboard/whatsapp",      label: "WhatsApp",    icon: MessageSquare                 },
  { href: "/dashboard/equipe",        label: "Equipe",      icon: Users,         adminOnly: true },
  { href: "/dashboard/configuracoes", label: "Config.",     icon: Settings        },
] as const;

interface SidebarProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const itens = NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-dark-600 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">LancheSmart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {itens.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 rounded-lg min-h-[44px] text-sm font-medium
                transition-colors border
                ${active
                  ? "bg-brand-500/15 text-brand-400 border-brand-500/25"
                  : "text-gray-400 hover:text-white hover:bg-dark-700 border-transparent"}
              `}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-600">
        {navContent}
      </aside>

      {/* Mobile — drawer + overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-dark-800 border-r border-dark-600 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
