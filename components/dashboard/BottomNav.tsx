"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { cn } from "@/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
};

// Top 5 items for mobile bottom nav
const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Visão", icon: LayoutDashboard },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/produtos", label: "Cardápio", icon: BookOpen, adminOnly: true },
  { href: "/dashboard/estoque", label: "Estoque", icon: Package },
  { href: "/dashboard/configuracoes", label: "Config", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const allowedItems = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="md:hidden border-t border-dark-500/50 bg-dark-800 flex items-center justify-around overflow-x-auto no-scrollbar shrink-0 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
      {allowedItems.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center w-[72px] px-1 py-1 gap-1 rounded-xl transition-colors",
              active ? "text-brand-500" : "text-dark-300 hover:text-dark-100"
            )}
          >
            <div className={cn(
              "p-1 rounded-lg flex items-center justify-center transition-all",
              active && "bg-brand-500/15"
            )}>
              <Icon size={20} className={cn(active && "drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]")} />
            </div>
            <span className={cn(
              "text-[10px] tracking-wide",
              active ? "font-semibold" : "font-medium"
            )}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
