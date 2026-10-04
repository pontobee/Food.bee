import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses = {
  primary:   "bg-brand-500 hover:bg-brand-600 text-dark-950",
  secondary: "bg-dark-600 border border-dark-400 text-dark-100 hover:bg-dark-500",
  outline:   "border border-dark-400 text-dark-100 hover:bg-dark-700",
  ghost:     "text-dark-200 hover:text-dark-100 hover:bg-dark-700",
  danger:    "bg-danger-500 hover:bg-red-600 text-white",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[32px]",
  md: "px-5 py-2.5 text-sm gap-2 min-h-[44px]",
  lg: "px-8 py-3.5 text-base gap-2.5 min-h-[48px]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg",
        "transition-colors duration-150 cursor-pointer",
        "focus-visible:ring-1 focus-visible:ring-brand-500/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}

      {children}

      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
