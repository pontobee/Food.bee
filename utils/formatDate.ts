/**
 * UTILS / formatDate — Formata datas em português brasileiro
 *
 * Usamos a biblioteca date-fns (instalada no package.json).
 * Ela é muito mais simples que trabalhar com o Date nativo do JavaScript.
 *
 * Como usar:
 *   formatDate(new Date())           → "05/06/2025"
 *   formatDateLong(new Date())       → "quinta-feira, 5 de junho de 2025"
 *   formatTime(new Date())           → "14:30"
 *   formatRelative(yesterday)        → "ontem"
 *   formatRelative(lastWeek)         → "há 7 dias"
 */

import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

// Formato curto: "05/06/2025"
export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

// Formato longo: "quinta-feira, 5 de junho de 2025"
export function formatDateLong(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Só o horário: "14:30"
export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

// Data + hora: "05/06/2025 às 14:30"
export function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy 'às' HH:mm");
}

/**
 * Formato relativo — muito usado em feeds e listagens de pedidos
 * "há 5 minutos", "ontem", "há 3 dias"
 * Melhora a experiência porque é mais natural que ver "05/06/2025 13:45"
 */
export function formatRelative(date: Date): string {
  if (isToday(date)) {
    const distance = formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    return distance;
  }
  if (isYesterday(date)) return "ontem";
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}
