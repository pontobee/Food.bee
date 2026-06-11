import Link      from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed, LayoutDashboard, ClipboardList,
  Package, DollarSign, MessageSquare, Settings,
} from "lucide-react";

// Sidebar estática sem next-auth (preview sem banco)
function PreviewSidebar() {
  const NAV = [
    { href: "/preview",          label: "Visão Geral", icon: LayoutDashboard },
    { href: "/preview/pedidos",  label: "Pedidos",     icon: ClipboardList   },
    { href: "/preview/estoque",  label: "Estoque",     icon: Package         },
    { href: "/preview/financeiro", label: "Financeiro", icon: DollarSign     },
    { href: "/preview/whatsapp", label: "WhatsApp",    icon: MessageSquare   },
    { href: "/preview/config",   label: "Config.",     icon: Settings        },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-dark-600">
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-dark-600 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">LancheSmart</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 rounded-lg min-h-[44px] text-sm
                       font-medium text-gray-400 hover:text-white hover:bg-dark-700
                       border border-transparent transition-colors">
            <Icon size={17} className="shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-dark-600">
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20
                         px-2 py-1 rounded-full">
          ★ Modo Preview
        </span>
      </div>
    </aside>
  );
}

function PreviewHeader() {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between
                       px-6 border-b border-dark-600 bg-dark-800">
      <p className="text-sm font-medium text-white">Hamburgueria Demo</p>
      <div className="text-right">
        <p className="text-sm font-medium text-white">Administrador</p>
        <p className="text-xs text-gray-500">ADMIN</p>
      </div>
    </header>
  );
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <PreviewSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PreviewHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
