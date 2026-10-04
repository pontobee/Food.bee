import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("card px-6 py-12 flex flex-col items-center text-center", className)}>
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-dark-300 mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-dark-100">{title}</p>
      {description && (
        <p className="text-sm text-dark-300 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
