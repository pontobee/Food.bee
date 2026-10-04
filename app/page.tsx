import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList, Package, DollarSign, MessageSquare,
  ArrowRight, ChefHat, Bike, Check, Mail, Phone, MapPin,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = {
  title:       "food.bee — Gestão inteligente para alimentação",
  description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp. Planos a partir de R$79,90/mês.",
  openGraph: {
    title:       "food.bee — Gestão inteligente para alimentação",
    description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp.",
  },
};

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
    descricao: "Para negócios em crescimento",
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
    <main className="min-h-screen bg-dark-900 text-dark-100">

      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Wordmark />
        <div className="flex items-center gap-1 sm:gap-2">
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

      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-dark-300 mb-6">
          Um produto .Bee
        </p>
        <h1 className="text-4xl md:text-6xl font-semibold text-dark-100 leading-[1.08] tracking-tight mb-6">
          Gestão inteligente<br />
          para alimentação
        </h1>
        <p className="text-dark-200 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Pedidos, estoque, financeiro e WhatsApp — organizados em uma plataforma.
          Clareza para o negócio, sem ruído na operação.
        </p>
        <Link href="/login" className="btn-primary text-base px-8 py-3">
          Começar agora
          <ArrowRight size={18} />
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ClipboardList, label: "Kanban de pedidos em tempo real" },
          { icon: Package,       label: "Controle de estoque com alertas" },
          { icon: DollarSign,    label: "Financeiro e margens de lucro"   },
          { icon: MessageSquare, label: "Automação via WhatsApp"          },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="card p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
              <Icon size={16} className="text-dark-200" />
            </div>
            <p className="text-sm text-dark-200">{label}</p>
          </div>
        ))}
      </section>

      <section id="como-funciona" className="border-t border-dark-500/50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dark-300">
              Como funciona
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-dark-100 mt-3 tracking-tight">
              Do pedido à entrega, sem complicação
            </h2>
            <p className="text-dark-200 mt-3 max-w-xl mx-auto">
              Um fluxo só, conectado de ponta a ponta — sua equipe foca em atender,
              o sistema cuida do resto.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-dark-500" />

            {PASSOS.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="relative card p-6 text-center flex flex-col items-center">
                <div className="w-11 h-11 rounded-xl bg-dark-700 flex items-center justify-center mb-4 ring-8 ring-dark-900">
                  <Icon size={20} className="text-dark-100" />
                </div>
                <h3 className="font-medium text-dark-100 mb-2">{titulo}</h3>
                <p className="text-sm text-dark-300 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-dark-500/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dark-300">
              Planos
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-dark-100 mt-3 tracking-tight">
              Escolha o tamanho ideal
            </h2>
            <p className="text-dark-200 mt-3 max-w-xl mx-auto">
              Comece simples e evolua quando o negócio crescer. Sem fidelidade,
              cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`card p-7 flex flex-col ${
                  plano.destaque ? "border-brand-500/40" : ""
                }`}
              >
                {plano.destaque && (
                  <span className="self-start mb-3 px-2.5 py-0.5 rounded-md text-xs font-medium bg-dark-700 text-brand-400">
                    Mais popular
                  </span>
                )}

                <h3 className="text-lg font-medium text-dark-100">{plano.nome}</h3>
                <p className="text-sm text-dark-300 mt-0.5 mb-5">{plano.descricao}</p>

                <p className="mb-6">
                  <span className="text-4xl font-semibold text-dark-100 tabular-nums">{formatCurrency(plano.preco)}</span>
                  <span className="text-sm text-dark-300">/mês</span>
                </p>

                <ul className="space-y-3 mb-7 flex-1">
                  {plano.recursos.map((recurso) => (
                    <li key={recurso} className="flex items-start gap-2.5 text-sm text-dark-200">
                      <Check size={16} className="text-brand-500 shrink-0 mt-0.5" />
                      {recurso}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={
                    plano.destaque
                      ? "btn-primary w-full justify-center"
                      : "btn-secondary w-full justify-center"
                  }
                >
                  Começar com {plano.nome}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-dark-500/50 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3">
                <Wordmark />
              </div>
              <p className="text-sm text-dark-300 leading-relaxed">
                Gestão para alimentação. Um produto do ecossistema .Bee.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-100 mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li><a href="#como-funciona" className="hover:text-dark-100 transition-colors">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-dark-100 transition-colors">Planos</a></li>
                <li><Link href="/login" className="hover:text-dark-100 transition-colors">Acessar painel</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-100 mb-3">Contato</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-dark-300 shrink-0" />
                  contato@lanchesmart.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-dark-300 shrink-0" />
                  (11) 99999-0000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-dark-300 shrink-0" />
                  São Paulo, SP
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-100 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li><span className="hover:text-dark-100 transition-colors cursor-pointer">Termos de uso</span></li>
                <li><span className="hover:text-dark-100 transition-colors cursor-pointer">Privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-500/50 mt-10 pt-6 text-center text-xs text-dark-300">
            © {new Date().getFullYear()} food.bee · um produto .Bee
          </div>
        </div>
      </footer>

    </main>
  );
}
