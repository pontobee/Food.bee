"use client";

import { useState } from "react";
import { Sidebar }       from "@/components/dashboard/Sidebar";
import { Header }        from "@/components/dashboard/Header";
import { OfflineBanner } from "@/components/dashboard/OfflineBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar isOpen={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <OfflineBanner />
        <Header onOpenMenu={() => setMenuAberto(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
