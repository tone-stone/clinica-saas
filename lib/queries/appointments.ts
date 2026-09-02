import { createClient } from "@/lib/supabase/server";

export interface BusySlot {
  staffId: string;
  start: string;
  durationMinutes: number;
}

/**
 * Citas futuras no canceladas de toda la clínica, usadas para calcular qué
 * horarios ya están ocupados por profesional al armar el selector de citas.
 */
export async function getBusySlots(tenantId: string): Promise<BusySlot[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("staff_id, scheduled_at, duration_minutes")
    .eq("tenant_id", tenantId)
    .neq("status", "cancelled")
    .gte("scheduled_at", startOfToday.toISOString());

  return (data ?? []).map((row) => ({
    staffId: row.staff_id,
    start: row.scheduled_at,
    durationMinutes: row.duration_minutes,
  }));
}
