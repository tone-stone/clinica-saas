/** Horario de atención por día de la semana (0 = domingo). null = cerrado. */
export const BUSINESS_HOURS: Record<number, [number, number] | null> = {
  0: null,
  1: [8 * 60, 19 * 60],
  2: [8 * 60, 19 * 60],
  3: [8 * 60, 19 * 60],
  4: [8 * 60, 19 * 60],
  5: [8 * 60, 19 * 60],
  6: [9 * 60, 14 * 60],
};

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Parsea un "YYYY-MM-DD" a medianoche local; si es inválido, devuelve la fecha actual. */
export function parseDateParam(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const parsed = new Date(y, m - 1, d);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(base: Date, months: number) {
  return new Date(base.getFullYear(), base.getMonth() + months, 1);
}

/** Parsea un "YYYY-MM" al primer día de ese mes; si es inválido, el mes actual. */
export function parseMonthParam(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    const parsed = new Date(y, m - 1, 1);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Días a mostrar en la grilla mensual (semanas completas, lunes a domingo).
 * Devuelve 35 (5 semanas) o 42 (6 semanas) según lo que requiera el mes.
 */
export function getMonthGridDays(monthStart: Date): Date[] {
  const jsDay = monthStart.getDay(); // 0 domingo .. 6 sábado
  const offsetFromMonday = (jsDay + 6) % 7;
  const gridStart = addDays(monthStart, -offsetFromMonday);

  const sixWeeks = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const lastWeek = sixWeeks.slice(35);
  const lastWeekOutsideMonth = lastWeek.every((d) => d.getMonth() !== monthStart.getMonth());
  return lastWeekOutsideMonth ? sixWeeks.slice(0, 35) : sixWeeks;
}
