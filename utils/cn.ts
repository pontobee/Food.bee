/**
 * UTILS / cn — Combina classes CSS de forma inteligente
 *
 * Por quê isso existe?
 * No React, às vezes precisamos adicionar classes CSS condicionalmente.
 * Exemplo: um botão que tem classe "disabled" só quando está desabilitado.
 *
 * O clsx resolve conflitos e o tailwind-merge garante que classes do Tailwind
 * não entrem em conflito (ex: "p-4 p-6" → usa só "p-6").
 *
 * Como usar:
 *   cn("bg-red-500", isActive && "font-bold", "text-white")
 *   → "bg-red-500 font-bold text-white" (se isActive for true)
 *   → "bg-red-500 text-white" (se isActive for false)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
