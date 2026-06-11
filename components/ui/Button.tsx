/**
 * UI / Button — Botão reutilizável do sistema
 *
 * Por que criar um componente de botão em vez de usar <button> direto?
 * Porque se você usar <button> em 100 lugares e depois quiser mudar o visual,
 * vai ter que mudar 100 vezes. Com esse componente, muda em UM lugar.
 *
 * Variantes disponíveis:
 *   - "primary"  → laranja sólido (ação principal)
 *   - "outline"  → borda laranja (ação secundária)
 *   - "ghost"    → sem fundo, só texto (ação terciária)
 *   - "danger"   → vermelho (ações destrutivas, ex: cancelar pedido)
 *
 * Tamanhos disponíveis:
 *   - "sm"  → pequeno (tabelas, listas)
 *   - "md"  → médio (padrão)
 *   - "lg"  → grande (landing page, CTAs)
 *
 * Como usar:
 *   <Button variant="primary" size="lg" onClick={handleClick}>
 *     Testar Demo
 *   </Button>
 *
 *   <Button variant="outline" isLoading={sending} leftIcon={<SendIcon />}>
 *     Enviar
 *   </Button>
 */

import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// "interface" define quais propriedades o componente aceita
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;   // Mostra um spinner giratório quando true
  leftIcon?: ReactNode;  // Ícone à esquerda do texto
  rightIcon?: ReactNode; // Ícone à direita do texto
}

// Mapeia cada variante para as classes CSS correspondentes
const variantClasses = {
  primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20",
  outline: "border-2 border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white",
  ghost:   "text-gray-400 hover:text-white hover:bg-dark-600",
  danger:  "bg-danger-500 hover:bg-red-700 text-white shadow-lg shadow-danger-500/20",
};

// Mapeia cada tamanho para as classes CSS correspondentes
const sizeClasses = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-8 py-3.5 text-base gap-2.5",
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
  ...props // Passa todos os outros atributos HTML normais (onClick, type, etc.)
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        // Classes base — aplicadas sempre
        "inline-flex items-center justify-center font-semibold rounded-xl",
        "transition-all duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Classes da variante e tamanho escolhidos
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Spinner de loading — aparece substituindo o ícone esquerdo */}
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
