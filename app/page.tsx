import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:       "LancheSmart — Sistema de Gestão para Lanchonetes",
  description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp. Planos a partir de R$79,90/mês.",
  openGraph: {
    title:       "LancheSmart — Sistema de Gestão para Lanchonetes",
    description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp.",
  },
};
import {
  UtensilsCrossed, ClipboardList, Package, DollarSign, MessageSquare,
  ArrowRight, ChefHat, Bike, Check, Mail, Phone, MapPin,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

// =============================================================================
// Landing Page (/) — vitrine pública do LancheSmart
// Server Component: é só conteúdo + links/âncoras, não precisa de estado no
// cliente. Mantém a identidade escura (bg-dark-900) com acento brand-500.
// =============================================================================

// ── Dados das seções (declarados fora do componente p/ não recriar a cada render) ──

// "Como Funciona": o fluxo operacional Pedido → Cozinha → Entrega.
const PASSOS = [
  {
    icon: ClipboardList,
    titulo: "1. Pedido",
    texto: "O cliente pede pelo balcão ou WhatsApp e o pedido cai no painel em tempo real, sem papel nem ruído.",
  },
  {
    icon: ChefHat,
    titulo: "2. Cozinha",
    texto: "A cozinha vê o pedido no Kanban, prepara e marca como pronto. O cronômetro mostra o tempo de cada item.",
  },
  {
    icon: Bike,
    titulo: "3. Entrega",
    texto: "Pedido pronto, o cliente é avisado automaticamente. Entregue, a venda já entra no seu financeiro.",
  },
] as const;

// "Planos": espelham os dados de /planos (Básico e Pro). O CTA leva ao login,
// onde o admin assina de fato.
const PLANOS = [
  {
    nome: "Básico",
    preco: 79.9,
    descricao: "Para quem está começando",
    destaque: false,
    recursos: [
      "Kanban de pedidos em tempo real",
      "Cadastro de produtos e adicionais",
      "Controle de estoque com alertas",
      "1 usuário administrador",
    ],
  },
  {
    nome: "Pro",
    preco: 119.9,
    descricao: "Para lanchonetes em crescimento",
    destaque: true,
    recursos: [
      "Tudo do plano Básico",
      "Painel financeiro e margens de lucro",
      "Usuários ilimitados (admin + caixa)",
      "Automação via WhatsApp",
    ],
  },
] as const;

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
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Âncoras para as novas seções (escondidas no mobile p/ não poluir) */}
          <a href="#como-funciona" className="hidden sm:inline-flex btn-ghost text-sm">
            Como funciona
          </a>
          <a href="#planos" className="hidden sm:inline-flex btn-ghost text-sm">
            Planos
          </a>
          <Link href="/login" className="btn-primary text-sm">
            Acessar painel
          </Link>
        </div>
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

      {/* ───────────────────────── Como Funciona ───────────────────────── */}
      <section id="como-funciona" className="border-t border-dark-600">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Como funciona
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
              Do pedido à entrega, sem complicação
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Um fluxo só, conectado de ponta a ponta — sua equipe foca em atender,
              o sistema cuida do resto.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Linha conectora (só no desktop, atrás dos cards) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-dark-600" />

            {PASSOS.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="relative card p-6 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4 ring-8 ring-dark-900">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{titulo}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Planos ───────────────────────────── */}
      <section id="planos" className="border-t border-dark-600">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Planos
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
              Escolha o tamanho ideal
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Comece simples e evolua quando a lanchonete crescer. Sem fidelidade,
              cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`card p-7 flex flex-col ${
                  plano.destaque ? "border-brand-500 ring-1 ring-brand-500/30" : ""
                }`}
              >
                {plano.destaque && (
                  <span className="self-start mb-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400">
                    Mais popular
                  </span>
                )}

                <h3 className="text-lg font-bold text-white">{plano.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5 mb-5">{plano.descricao}</p>

                <p className="mb-6">
                  <span className="text-4xl font-black text-white">{formatCurrency(plano.preco)}</span>
                  <span className="text-sm text-gray-500">/mês</span>
                </p>

                <ul className="space-y-3 mb-7 flex-1">
                  {plano.recursos.map((recurso) => (
                    <li key={recurso} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check size={16} className="text-brand-400 shrink-0 mt-0.5" />
                      {recurso}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={
                    plano.destaque
                      ? "btn-primary w-full justify-center"
                      : "btn-ghost w-full justify-center border border-dark-600"
                  }
                >
                  Começar com {plano.nome}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Footer ───────────────────────────── */}
      <footer className="border-t border-dark-600 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

            {/* Marca */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <UtensilsCrossed size={16} className="text-white" />
                </div>
                <span className="font-bold text-white">LancheSmart</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                A gestão completa da sua lanchonete em um só lugar.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#como-funciona" className="hover:text-brand-400 transition-colors">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-brand-400 transition-colors">Planos</a></li>
                <li><Link href="/login" className="hover:text-brand-400 transition-colors">Acessar painel</Link></li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-brand-400 shrink-0" />
                  contato@lanchesmart.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-brand-400 shrink-0" />
                  (11) 99999-0000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-brand-400 shrink-0" />
                  São Paulo, SP
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><span className="hover:text-brand-400 transition-colors cursor-pointer">Termos de uso</span></li>
                <li><span className="hover:text-brand-400 transition-colors cursor-pointer">Privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-600 mt-10 pt-6 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} LancheSmart. Todos os direitos reservados.
          </div>
        </div>
      </footer>

    </main>
  );
}
