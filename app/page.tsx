import Link from "next/link";
import { UtensilsCrossed, ClipboardList, Package, DollarSign, MessageSquare, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark-900 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-dark-600 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <UtensilsCrossed size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">LancheSmart</span>
        </div>
        <Link href="/login"
              className="btn-primary text-sm">
          Acessar painel
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
          Gestão completa para<br />
          <span className="text-brand-500">sua lanchonete</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
          Pedidos em tempo real, estoque, financeiro e WhatsApp — tudo integrado
          em uma plataforma profissional.
        </p>
        <Link href="/login" className="btn-primary text-base px-8 py-3">
          Começar agora
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ClipboardList, label: "Kanban de pedidos em tempo real" },
          { icon: Package,       label: "Controle de estoque com alertas" },
          { icon: DollarSign,    label: "Financeiro e margens de lucro"   },
          { icon: MessageSquare, label: "Automação via WhatsApp"          },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="card p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <Icon size={18} className="text-brand-400" />
            </div>
            <p className="text-sm text-gray-300">{label}</p>
          </div>
        ))}
      </section>

    </main>
  );
}
