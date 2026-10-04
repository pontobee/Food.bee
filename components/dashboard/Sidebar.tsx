"use client";

import Link             from "next/link";
import { usePathname }  from "next/navigation";
import { useSession }   from "next-auth/react";
import {
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
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/dashboard/pedidos",  label: "Pedidos",  icon: ClipboardList },
      { href: "/dashboard/produtos", label: "Cardápio", icon: BookOpen, adminOnly: true },
      { href: "/dashboard/estoque",  label: "Estoque",  icon: Package },
    ],
  },
  {
    label: "Negócio",
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign, adminOnly: true },
      { href: "/dashboard/clientes",   label: "Clientes",   icon: Contact,    adminOnly: true },
    ],
  },
  {
    label: "Conexões",
    items: [
      { href: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageSquare },
      { href: "/dashboard/equipe",   label: "Equipe",   icon: Users, adminOnly: true },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  const navContent = (
    <>
      <div className="flex items-center h-14 px-4 shrink-0">
        <Link href="/dashboard" className="min-w-0">
          <Wordmark size="sm" />
        </Link>
      </div>

      <nav className="flex-1 px-2 pb-4 overflow-y-auto">
        {groups.map((group, i) => (
          <div key={group.label} className={cn(i > 0 && "mt-5")}>
            <p className="px-3 mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-dark-300">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn("nav-item", active && "nav-item-active")}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500"
                      />
                    )}
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-500/50">
      {navContent}
    </aside>
  );
}
