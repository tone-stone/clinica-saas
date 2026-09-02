import { createClient } from "@/lib/supabase/server";
import { BUSINESS_HOURS } from "@/lib/scheduling";

/** Horas de atención por día de la semana (0 = domingo). null = cerrado. */
export type StaffHours = Record<number, [number, number] | null>;

function defaultHours(): StaffHours {
  return { 0: BUSINESS_HOURS[0], 1: BUSINESS_HOURS[1], 2: BUSINESS_HOURS[2], 3: BUSINESS_HOURS[3], 4: BUSINESS_HOURS[4], 5: BUSINESS_HOURS[5], 6: BUSINESS_HOURS[6] };
}

/**
 * Horario configurado por profesional. Si un profesional nunca lo configuró
 * (sin filas en staff_availability), se usa el horario general por defecto.
 */
export async function getAvailabilityMap(
  tenantId: string,
  staffIds: string[]
): Promise<Record<string, StaffHours>> {
  const map: Record<string, StaffHours> = {};
  if (staffIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_availability")
    .select("staff_id, day_of_week, start_minutes, end_minutes")
    .eq("tenant_id", tenantId)
    .in("staff_id", staffIds);

  for (const staffId of staffIds) {
    const rows = (data ?? []).filter((r) => r.staff_id === staffId);
    if (rows.length === 0) {
      map[staffId] = defaultHours();
      continue;
    }
    const hours: StaffHours = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    for (const row of rows) {
      hours[row.day_of_week] =
        row.start_minutes !== null && row.end_minutes !== null
          ? [row.start_minutes, row.end_minutes]
          : null;
    }
    map[staffId] = hours;
  }
  return map;
}
