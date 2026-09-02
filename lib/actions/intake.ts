"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";

const intakeSchema = z.object({
  appointmentId: z.string().uuid(),
  motivo: z.string().optional(),
  sintomas: z.string().optional(),
  severidad: z.string().optional(),
});

export interface IntakeFormState {
  error?: string;
  success?: boolean;
}

/** El paciente cuenta contexto de su propia cita antes de que ocurra. */
export async function saveIntake(
  _prevState: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
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

  const parsed = intakeSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    motivo: formData.get("motivo"),
    sintomas: formData.get("sintomas"),
    severidad: formData.get("severidad"),
  });
  if (!parsed.success) return { error: "Revisa los datos del formulario" };

  const { error } = await supabase.from("appointment_intake").upsert(
    {
      tenant_id: tenant.id,
      appointment_id: parsed.data.appointmentId,
      patient_id: patient.id,
      motivo: parsed.data.motivo || null,
      sintomas: parsed.data.sintomas || null,
      severidad: parsed.data.severidad || null,
    },
    { onConflict: "appointment_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/portal/citas");
  return { success: true };
}
