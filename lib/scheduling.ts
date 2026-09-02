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
