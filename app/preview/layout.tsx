"use client";

import Link      from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList,
  Package, DollarSign, MessageSquare, Settings,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/utils/cn";

function PreviewSidebar() {
  const pathname = usePathname();
  const NAV = [
    { href: "/preview",          label: "Visão geral", icon: LayoutDashboard },
    { href: "/preview/pedidos",  label: "Pedidos",     icon: ClipboardList   },
    { href: "/preview/estoque",  label: "Estoque",     icon: Package         },
    { href: "/preview/financeiro", label: "Financeiro", icon: DollarSign     },
    { href: "/preview/whatsapp", label: "WhatsApp",    icon: MessageSquare   },
    { href: "/preview/config",   label: "Config.",     icon: Settings        },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-500/50">
      <div className="flex items-center h-14 px-4 shrink-0">
        <Wordmark size="sm" />
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn("nav-item", active && "nav-item-active")}
            >
              {active && (
                <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500" />
              )}
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <span className="text-[10px] uppercase tracking-wider text-dark-300">
          Modo preview
        </span>
      </div>
    </aside>
  );
}

function PreviewHeader() {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between
                       px-6 border-b border-dark-500/50 bg-dark-900">
      <p className="text-sm font-medium text-dark-100">Hamburgueria Demo</p>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-dark-100">Administrador</p>
          <p className="text-[11px] text-dark-300">ADMIN</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-dark-600 text-dark-200 text-xs font-semibold flex items-center justify-center">
          AD
        </div>
      </div>
    </header>
  );
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden text-dark-100">
      <PreviewSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PreviewHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
