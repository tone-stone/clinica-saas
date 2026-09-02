"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";

export interface AvailabilityFormState {
  error?: string;
}

function parseTime(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Guarda el horario de atención (los 7 días) de un profesional. */
export async function updateAvailability(
  _prevState: AvailabilityFormState,
  formData: FormData
): Promise<AvailabilityFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return { error: "Falta el profesional" };

  const rows = Array.from({ length: 7 }, (_, day) => {
    const closed = formData.get(`closed_${day}`) === "on";
    return {
      tenant_id: tenant.id,
      staff_id: staffId,
      day_of_week: day,
      start_minutes: closed ? null : parseTime(formData.get(`start_${day}`)),
      end_minutes: closed ? null : parseTime(formData.get(`end_${day}`)),
    };
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_availability")
    .upsert(rows, { onConflict: "tenant_id,staff_id,day_of_week" });
  if (error) return { error: error.message };

  revalidatePath("/equipo");
  return {};
}
