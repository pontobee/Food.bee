import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  featured?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({ label, value, hint, featured, icon, className }: StatsCardProps) {
  return (
    <div className={cn("stat-card", featured && "lg:col-span-1", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-dark-300">{label}</p>
        {icon && <span className="text-dark-300 shrink-0">{icon}</span>}
      </div>
      <p className={cn(
        "mt-2 font-semibold tabular-nums tracking-tight text-dark-100",
        featured ? "text-2xl" : "text-xl",
      )}>
        {value}
      </p>
      {hint && <p className="text-xs text-dark-300 mt-1">{hint}</p>}
    </div>
  );
}
