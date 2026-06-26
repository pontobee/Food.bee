import type { Metadata } from "next";
import { Providers }      from "@/components/Providers";
import { ErrorBoundary }  from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title:       "LancheSmart — Gestão de Lanchonetes",
  description: "Controle de pedidos, estoque, financeiro e WhatsApp em uma plataforma.",
  openGraph: {
    title:       "LancheSmart",
    description: "SaaS completo para lanchonetes",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-dark-900 text-white antialiased">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
