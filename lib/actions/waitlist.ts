"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import type { WaitlistStatus } from "@/lib/supabase/database.types";

export interface WaitlistFormState {
  error?: string;
  success?: boolean;
}

const joinSchema = z.object({
  note: z.string().optional(),
});

/** El paciente se apunta a la lista de espera (staff la revisa manualmente al cancelarse un cupo). */
export async function joinWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData
): Promise<WaitlistFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!patient) return { error: "No se encontró tu ficha de paciente" };

  const parsed = joinSchema.safeParse({ note: formData.get("note") });
  if (!parsed.success) return { error: "Revisa los datos del formulario" };

  const { error } = await supabase.from("waitlist_entries").insert({
    tenant_id: tenant.id,
    patient_id: patient.id,
    note: parsed.data.note || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/portal/citas");
  return { success: true };
}

/** Staff marca una entrada como resuelta (ya se le ofreció/agendó cupo) o la cancela. */
export async function updateWaitlistStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = formData.get("status") as WaitlistStatus;

  const supabase = await createClient();
  await supabase.from("waitlist_entries").update({ status }).eq("id", id);

  revalidatePath("/citas");
}
