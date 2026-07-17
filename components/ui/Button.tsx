import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses = {
  primary:
    "bg-gradient-brand text-white shadow-glow-sm " +
    "hover:shadow-glow hover:brightness-105 " +
    "active:scale-95 active:shadow-none",
  outline:
    "border border-brand-500/60 text-brand-400 " +
    "hover:bg-brand-500/10 hover:border-brand-500 hover:text-brand-300 " +
    "active:scale-95",
  ghost:
    "text-gray-400 hover:text-white hover:bg-dark-600/80 " +
    "active:scale-95",
  danger:
    "bg-red-600 hover:bg-red-500 text-white " +
    "shadow-[0_0_16px_0_rgb(239_68_68_/_0.2)] " +
    "hover:shadow-[0_0_24px_0_rgb(239_68_68_/_0.35)] " +
    "active:scale-95",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[34px]",
  md: "px-5 py-2.5 text-sm gap-2 min-h-[42px]",
  lg: "px-8 py-3.5 text-base gap-2.5 min-h-[50px]",
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
        "inline-flex items-center justify-center font-semibold rounded-xl",
        "transition-all duration-200 cursor-pointer select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className
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
