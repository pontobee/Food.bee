"use client";

import Link             from "next/link";
import { usePathname }  from "next/navigation";
import {
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  Package,
  DollarSign,
  MessageSquare,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",               label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/pedidos",       label: "Pedidos",     icon: ClipboardList   },
  { href: "/dashboard/estoque",       label: "Estoque",     icon: Package         },
  { href: "/dashboard/financeiro",    label: "Financeiro",  icon: DollarSign      },
  { href: "/dashboard/whatsapp",      label: "WhatsApp",    icon: MessageSquare   },
  { href: "/dashboard/configuracoes", label: "Config.",     icon: Settings        },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-600">
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-dark-600 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">LancheSmart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  );
}
