import type { Metadata } from "next";
import { Inter }          from "next/font/google";
import { Providers }      from "@/components/Providers";
import { ErrorBoundary }  from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://lanchesmart.com.br"),
  title: {
    default:  "LancheSmart — Gestão de Lanchonetes",
    template: "%s | LancheSmart",
  },
  description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma. Gestão completa para lanchonetes e restaurantes.",
  openGraph: {
    title:       "LancheSmart — Gestão de Lanchonetes",
    description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma.",
    type:        "website",
    locale:      "pt_BR",
    siteName:    "LancheSmart",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "LancheSmart — Gestão de Lanchonetes",
    description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-dark-900 text-white antialiased">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
