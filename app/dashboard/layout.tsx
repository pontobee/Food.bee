"use client";

import { Sidebar }       from "@/components/dashboard/Sidebar";
import { Header }        from "@/components/dashboard/Header";
import { OfflineBanner } from "@/components/dashboard/OfflineBanner";
import { BottomNav }     from "@/components/dashboard/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden text-dark-100">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <OfflineBanner />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
