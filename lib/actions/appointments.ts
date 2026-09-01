"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  staffId: z.string().uuid("Selecciona un profesional"),
  scheduledAt: z.string().min(1, "Selecciona fecha y hora"),
  durationMinutes: z.coerce.number().int().positive().default(30),
  reason: z.string().optional(),
});

export interface AppointmentFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Staff agenda una cita para un paciente existente. */
export async function createAppointment(
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const parsed = appointmentSchema.safeParse({
    patientId: formData.get("patientId"),
    staffId: formData.get("staffId"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes") || 30,
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos de la cita", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("appointments").insert({
    tenant_id: tenant.id,
    patient_id: parsed.data.patientId,
    staff_id: parsed.data.staffId,
    scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
    duration_minutes: parsed.data.durationMinutes,
    reason: parsed.data.reason || null,
    status: "pending",
    created_by: user?.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/citas");
  revalidatePath(`/pacientes/${parsed.data.patientId}`);
  redirect(`/pacientes/${parsed.data.patientId}`);
}

const requestSchema = z.object({
  staffId: z.string().uuid("Selecciona un profesional"),
  scheduledAt: z.string().min(1, "Selecciona fecha y hora"),
  reason: z.string().optional(),
});

/** El paciente solicita su propia cita (queda en estado "pending" hasta que el staff la confirme). */
export async function requestAppointment(
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
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
  if (!patient) return { error: "No se encontró tu ficha de paciente en esta clínica" };

  const parsed = requestSchema.safeParse({
    staffId: formData.get("staffId"),
    scheduledAt: formData.get("scheduledAt"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos", fieldErrors };
  }

  const { error } = await supabase.from("appointments").insert({
    tenant_id: tenant.id,
    patient_id: patient.id,
    staff_id: parsed.data.staffId,
    scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
    status: "pending",
    reason: parsed.data.reason || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/portal/citas");
  redirect("/portal/citas");
}

/**
 * Cambia el estado de una cita. Sirve tanto para acciones de staff (confirmar,
 * completar, no-show, cancelar) como para que un paciente cancele la suya
 * propia — RLS decide qué transición está permitida según quién llama.
 */
export async function updateAppointmentStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = formData.get("status") as AppointmentStatus;
  const revalidateTarget = String(formData.get("revalidateTarget") ?? "/citas");

  const supabase = await createClient();
  await supabase.from("appointments").update({ status }).eq("id", id);

  revalidatePath(revalidateTarget);
  revalidatePath("/citas");
  revalidatePath("/portal/citas");
}
