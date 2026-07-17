"use client";

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { useSession }  from "next-auth/react";
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
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",               label: "Visão Geral", icon: LayoutDashboard                  },
  { href: "/dashboard/pedidos",       label: "Pedidos",     icon: ClipboardList                    },
  { href: "/dashboard/produtos",      label: "Cardápio",    icon: BookOpen,      adminOnly: true   },
  { href: "/dashboard/estoque",       label: "Estoque",     icon: Package                          },
  { href: "/dashboard/financeiro",    label: "Financeiro",  icon: DollarSign,    adminOnly: true   },
  { href: "/dashboard/clientes",      label: "Clientes",    icon: Contact,       adminOnly: true   },
  { href: "/dashboard/whatsapp",      label: "WhatsApp",    icon: MessageSquare                    },
  { href: "/dashboard/equipe",        label: "Equipe",      icon: Users,         adminOnly: true   },
  { href: "/dashboard/configuracoes", label: "Config.",     icon: Settings                         },
] as const;

interface SidebarProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const itens = NAV.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || isAdmin
  );

  const navContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-dark-600/60 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
          <UtensilsCrossed size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-white text-sm tracking-tight">LancheSmart</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
              className={[
                "nav-item",
                active ? "nav-item-active" : "",
              ].join(" ")}
            >
              <Icon
                size={17}
                className={[
                  "shrink-0 transition-colors duration-200",
                  active ? "text-brand-400" : "text-gray-500",
                ].join(" ")}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Badge Pro (rodapé) ── */}
      <div className="p-3 border-t border-dark-600/60 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/40">
          <Zap size={14} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white leading-none">Plano Pro</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Todos os módulos ativos</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-600/60">
        {navContent}
      </aside>

      {/* Mobile — drawer + overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-60 flex flex-col bg-dark-800 border-r border-dark-600/60 shadow-card-xl animate-slide-in">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
