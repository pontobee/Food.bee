import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Planos e Preços",
  description: "Conheça os planos do food.bee. Básico a partir de R$79,90/mês. Sem fidelidade.",
  openGraph: {
    title:       "Planos e Preços | food.bee",
    description: "Conheça os planos do food.bee. Básico a partir de R$79,90/mês.",
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
