import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-dark-600 text-dark-200",
  brand:   "bg-brand-500/15 text-brand-400",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger:  "bg-red-500/15 text-red-400",
  info:    "bg-blue-500/15 text-blue-400",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
