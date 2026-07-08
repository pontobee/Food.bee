import type { Metadata } from "next";
import { prisma }        from "@/lib/prisma";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const lanchonete = await prisma.lanchonete.findUnique({
    where:  { slug },
    select: { nome: true },
  });

  if (!lanchonete) return { title: "Cardápio Digital" };

  return {
    title:       `Cardápio — ${lanchonete.nome}`,
    description: `Faça seu pedido online no cardápio digital de ${lanchonete.nome}.`,
    openGraph: {
      title:       `Cardápio — ${lanchonete.nome}`,
      description: `Faça seu pedido online no cardápio digital de ${lanchonete.nome}.`,
      type:        "website",
    },
  };
}

export default function CardapioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
