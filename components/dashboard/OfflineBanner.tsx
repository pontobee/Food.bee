"use client";

import { useEffect, useState } from "react";
import { WifiOff }             from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/15 border-b
                    border-amber-500/30 px-4 py-2 text-amber-400 text-sm font-medium">
      <WifiOff size={15} className="shrink-0" />
      Conexão perdida — dados em cache. Reconectando…
    </div>
  );
}
