import type { Metadata } from "next";
import Link from "next/link";
import {
  UtensilsCrossed, ClipboardList, Package, DollarSign, MessageSquare,
  ArrowRight, ChefHat, Bike, Check, Mail, Phone, MapPin, Zap, Star,
  TrendingUp, Users,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

export const metadata: Metadata = {
  title:       "LancheSmart — Sistema de Gestão para Lanchonetes",
  description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp. Planos a partir de R$79,90/mês.",
  openGraph: {
    title:       "LancheSmart — Sistema de Gestão para Lanchonetes",
    description: "Gerencie pedidos em tempo real, controle estoque, acompanhe o financeiro e automatize notificações via WhatsApp.",
  },
};

const PASSOS = [
  {
    icon:   ClipboardList,
    titulo: "1. Pedido",
    texto:  "O cliente pede pelo balcão ou WhatsApp e o pedido cai no painel em tempo real, sem papel nem ruído.",
    color:  "text-blue-400",
    bg:     "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon:   ChefHat,
    titulo: "2. Cozinha",
    texto:  "A cozinha vê o pedido no Kanban, prepara e marca como pronto. O cronômetro mostra o tempo de cada item.",
    color:  "text-brand-400",
    bg:     "bg-brand-500/10 border-brand-500/20",
  },
  {
    icon:   Bike,
    titulo: "3. Entrega",
    texto:  "Pedido pronto, o cliente é avisado automaticamente. Entregue, a venda já entra no seu financeiro.",
    color:  "text-emerald-400",
    bg:     "bg-emerald-500/10 border-emerald-500/20",
  },
] as const;

const PLANOS = [
  {
    nome:      "Básico",
    preco:     79.9,
    descricao: "Para quem está começando",
    destaque:  false,
    recursos: [
      "Kanban de pedidos em tempo real",
      "Cadastro de produtos e adicionais",
      "Controle de estoque com alertas",
      "1 usuário administrador",
    ],
  },
  {
    nome:      "Pro",
    preco:     119.9,
    descricao: "Para lanchonetes em crescimento",
    destaque:  true,
    recursos: [
      "Tudo do plano Básico",
      "Painel financeiro e margens de lucro",
      "Usuários ilimitados (admin + caixa)",
      "Automação via WhatsApp",
    ],
  },
] as const;

const FEATURES = [
  { icon: ClipboardList, label: "Kanban em tempo real",      desc: "Pedidos chegam instantaneamente na tela, sem refresh."     },
  { icon: Package,       label: "Controle de estoque",       desc: "Alertas automáticos antes de faltar produto."              },
  { icon: DollarSign,    label: "Financeiro e margens",      desc: "Veja lucro real por produto e período."                    },
  { icon: MessageSquare, label: "Automação WhatsApp",        desc: "Notifique clientes automaticamente a cada status."         },
] as const;

const STATS = [
  { value: "2.400+", label: "Lanchonetes",   icon: Users        },
  { value: "180mil", label: "Pedidos/mês",   icon: ClipboardList },
  { value: "32%",    label: "Aumento médio", icon: TrendingUp   },
  { value: "4.9/5",  label: "Avaliação",     icon: Star         },
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark-900 text-white overflow-x-hidden">

      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-dark-600/50 bg-dark-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <UtensilsCrossed size={15} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">LancheSmart</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#como-funciona" className="hidden sm:inline-flex btn-ghost text-sm px-4">
              Como funciona
            </a>
            <a href="#planos" className="hidden sm:inline-flex btn-ghost text-sm px-4">
              Planos
            </a>
            <Link
              href="/login"
              className="btn-primary text-sm"
            >
              Acessar painel
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
                          bg-brand-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px]
                          bg-blue-500/6 blur-[80px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                          bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs font-semibold
                          mb-8 animate-fade-in">
            <Zap size={12} />
            Automação completa para lanchonetes
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "60ms" }}>
            Gestão completa para<br />
            <span className="gradient-text">sua lanchonete</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in"
             style={{ animationDelay: "120ms" }}>
            Pedidos em tempo real, estoque, financeiro e WhatsApp —
            tudo integrado em uma plataforma profissional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in"
               style={{ animationDelay: "180ms" }}>
            <Link
              href="/login"
              className="btn-primary text-base px-8 py-3.5 shadow-glow"
            >
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <a
              href="#como-funciona"
              className="btn-ghost text-base px-6 py-3.5"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="border-y border-dark-600/50 bg-dark-800/40">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon size={16} className="text-brand-400 shrink-0" />
                  <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                </div>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
            Tudo que você precisa, <br className="hidden sm:block" />num só lugar
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-6 flex flex-col gap-4 hover:border-dark-500/70 hover:shadow-card-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-brand-subtle border border-brand-500/15
                              flex items-center justify-center
                              group-hover:shadow-glow-sm transition-shadow duration-200">
                <Icon size={19} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Como Funciona ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="border-t border-dark-600/50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Como funciona
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
              Do pedido à entrega, sem complicação
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto leading-relaxed">
              Um fluxo só, conectado de ponta a ponta — sua equipe foca em atender,
              o sistema cuida do resto.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
            <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-px
                            bg-gradient-to-r from-transparent via-dark-500 to-transparent" />

            {PASSOS.map(({ icon: Icon, titulo, texto, color, bg }) => (
              <div key={titulo} className="card p-7 text-center flex flex-col items-center
                                           hover:shadow-card-lg transition-all duration-200 relative">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5
                                 ring-8 ring-dark-900 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-white mb-2 tracking-tight">{titulo}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Planos ──────────────────────────────────────────────────────── */}
      <section id="planos" className="border-t border-dark-600/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Planos
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
              Escolha o tamanho ideal
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto leading-relaxed">
              Comece simples e evolua quando a lanchonete crescer.
              Sem fidelidade, cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto stagger-children">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={[
                  "relative card p-7 flex flex-col",
                  plano.destaque
                    ? "border-brand-500/40 shadow-glow-sm ring-1 ring-brand-500/20"
                    : "hover:border-dark-500/70",
                  "hover:shadow-card-lg transition-all duration-200",
                ].join(" ")}
              >
                {plano.destaque && (
                  <span className="self-start mb-4 px-3 py-1 rounded-full text-xs font-bold
                                   bg-gradient-brand text-white shadow-glow-sm">
                    Mais popular
                  </span>
                )}

                <h3 className="text-lg font-bold text-white tracking-tight">{plano.nome}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">{plano.descricao}</p>

                <p className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white tracking-tight">
                    {formatCurrency(plano.preco)}
                  </span>
                  <span className="text-sm text-gray-500">/mês</span>
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plano.recursos.map((recurso) => (
                    <li key={recurso} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check size={15} className="text-brand-400 shrink-0 mt-0.5" />
                      {recurso}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={plano.destaque ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center border border-dark-500/60 hover:border-dark-400"}
                >
                  Começar com {plano.nome}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-dark-600/50 bg-dark-800/50">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
                  <UtensilsCrossed size={15} className="text-white" />
                </div>
                <span className="font-bold text-white tracking-tight">LancheSmart</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                A gestão completa da sua lanchonete em um só lugar.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#como-funciona" className="hover:text-brand-400 transition-colors">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-brand-400 transition-colors">Planos</a></li>
                <li><Link href="/login" className="hover:text-brand-400 transition-colors">Acessar painel</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <Mail size={13} className="text-brand-400 shrink-0" />
                  contato@lanchesmart.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={13} className="text-brand-400 shrink-0" />
                  (11) 99999-0000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={13} className="text-brand-400 shrink-0" />
                  São Paulo, SP
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><span className="hover:text-brand-400 transition-colors cursor-pointer">Termos de uso</span></li>
                <li><span className="hover:text-brand-400 transition-colors cursor-pointer">Privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="divider mt-10 pt-6 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} LancheSmart. Todos os direitos reservados.
          </div>
        </div>
      </footer>

    </main>
  );
}
