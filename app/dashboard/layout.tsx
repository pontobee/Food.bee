import { Sidebar }      from "@/components/dashboard/Sidebar";
import { Header }       from "@/components/dashboard/Header";
import { OfflineBanner } from "@/components/dashboard/OfflineBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 3 zonas fixas: sidebar esquerda | cabeçalho + conteúdo à direita
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <OfflineBanner />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
