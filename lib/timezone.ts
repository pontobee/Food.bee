// BRT = UTC-3. Hardcoded enquanto não houver timezone por tenant no schema.
// Quando lanchonete.timezone for adicionado, trocar BRT_OFFSET_HOURS pelo
// valor do tenant e passar como argumento.
const BRT_OFFSET_HOURS = -3;

/**
 * Retorna o timestamp UTC que corresponde à meia-noite de "hoje"
 * no fuso horário especificado.
 *
 * Exemplo (servidor em UTC, fuso BRT = UTC-3):
 *   17h UTC → 14h BRT → meia-noite BRT = 03:00 UTC
 *   → retorna Date representando 2025-06-25T03:00:00.000Z
 */
export function startOfDayInTZ(offsetHours: number = BRT_OFFSET_HOURS): Date {
  const offsetMs = offsetHours * 60 * 60 * 1000;
  // Desloca o "agora" para o fuso alvo, encontra meia-noite, volta para UTC
  const localNow = new Date(Date.now() + offsetMs);
  localNow.setUTCHours(0, 0, 0, 0);
  return new Date(localNow.getTime() - offsetMs);
}

/**
 * Retorna o timestamp UTC que corresponde ao dia 1 do mês atual
 * à meia-noite no fuso horário especificado.
 */
export function startOfMonthInTZ(offsetHours: number = BRT_OFFSET_HOURS): Date {
  const offsetMs = offsetHours * 60 * 60 * 1000;
  const localNow = new Date(Date.now() + offsetMs);
  localNow.setUTCDate(1);
  localNow.setUTCHours(0, 0, 0, 0);
  return new Date(localNow.getTime() - offsetMs);
}

/** Atalhos para o fuso padrão do produto (BRT). */
export const startOfDayBRT   = () => startOfDayInTZ(BRT_OFFSET_HOURS);
export const startOfMonthBRT = () => startOfMonthInTZ(BRT_OFFSET_HOURS);
