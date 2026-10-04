import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers }      from "@/components/Providers";
import { ErrorBoundary }  from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default:  "food.bee — Gestão inteligente para alimentação",
    template: "%s | food.bee",
  },
  description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma. Gestão completa para negócios de alimentação.",
  openGraph: {
    title:       "food.bee — Gestão inteligente para alimentação",
    description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma. Gestão completa para negócios de alimentação.",
    type:        "website",
    locale:      "pt_BR",
    siteName:    "food.bee",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "food.bee — Gestão inteligente para alimentação",
    description: "Gerencie pedidos, estoque, financeiro e WhatsApp em uma plataforma. Gestão completa para negócios de alimentação.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} bg-dark-900 text-dark-100 antialiased`}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
