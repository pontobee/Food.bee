/**
 * UTILS / formatCurrency — Formata números como moeda brasileira
 *
 * Por quê isso existe?
 * Toda vez que exibimos um preço, precisamos do formato "R$ 1.234,56".
 * Em vez de repetir essa lógica em 50 lugares diferentes, criamos UMA função
 * e chamamos ela onde precisar. Se precisar mudar (ex: adicionar centavos),
 * muda em um lugar só.
 *
 * Como usar:
 *   formatCurrency(1250)     → "R$ 1.250,00"
 *   formatCurrency(9.9)      → "R$ 9,90"
 *   formatCurrency(0)        → "R$ 0,00"
 */

export function formatCurrency(value: number): string {
  // Intl.NumberFormat é nativo do JavaScript — formata moeda sem depender de bibliotecas
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata um número como porcentagem
 * Exemplo: formatPercent(12.5) → "+12,5%"
 * O "+" aparece quando é positivo (crescimento), "-" quando negativo (queda)
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1).replace(".", ",")}%`;
}

/**
 * Formata números grandes de forma compacta
 * Exemplo: formatCompact(1250000) → "1,25M"
 * Exemplo: formatCompact(3500) → "3,5K"
 * Útil para cards de resumo onde o espaço é limitado
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}
