"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import { notifyAppointmentEvent } from "@/lib/notifications/appointment-notifications";
import type { AppointmentStatus } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Junta los datos de paciente/profesional que necesita la notificación y la dispara. */
async function notifyAppointment(
  supabase: SupabaseClient<Database>,
  event: "created" | "confirmed" | "cancelled",
  tenantName: string,
  appointment: {
    patient_id: string;
    staff_id: string;
    scheduled_at: string;
    duration_minutes: number;
    reason: string | null;
  }
) {
  try {
    const [{ data: patient }, { data: staffProfile }] = await Promise.all([
      supabase
        .from("patients")
        .select("full_name, email, phone")
        .eq("id", appointment.patient_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", appointment.staff_id)
        .maybeSingle(),
    ]);
    if (!patient) return;

    await notifyAppointmentEvent({
      event,
      clinicName: tenantName,
      patientName: patient.full_name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      staffName: staffProfile?.full_name ?? staffProfile?.email ?? "tu profesional",
      scheduledAt: appointment.scheduled_at,
      durationMinutes: appointment.duration_minutes,
      reason: appointment.reason,
    });
  } catch (error) {
    console.error("[notifications] No se pudo notificar la cita:", error);
  }
}

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

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenant.id,
      patient_id: parsed.data.patientId,
      staff_id: parsed.data.staffId,
      scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
      duration_minutes: parsed.data.durationMinutes,
      reason: parsed.data.reason || null,
      status: "pending",
      created_by: user?.id,
    })
    .select("patient_id, staff_id, scheduled_at, duration_minutes, reason")
    .single();
  if (error) return { error: error.message };

  await notifyAppointment(supabase, "created", tenant.name, appointment);

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

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenant.id,
      patient_id: patient.id,
      staff_id: parsed.data.staffId,
      scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
      status: "pending",
      reason: parsed.data.reason || null,
      created_by: user.id,
    })
    .select("patient_id, staff_id, scheduled_at, duration_minutes, reason")
    .single();
  if (error) return { error: error.message };

  await notifyAppointment(supabase, "created", tenant.name, appointment);

  revalidatePath("/portal/citas");
  redirect("/portal/citas");
}

/** Staff reprograma una cita existente: profesional, fecha/hora, duración o motivo. */
export async function updateAppointmentDetails(
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la cita a editar" };

  const parsed = appointmentSchema
    .omit({ patientId: true })
    .extend({
      price: z.coerce.number().min(0).optional(),
      paymentStatus: z.enum(["unpaid", "paid", "waived"]).optional(),
    })
    .safeParse({
      staffId: formData.get("staffId"),
      scheduledAt: formData.get("scheduledAt"),
      durationMinutes: formData.get("durationMinutes") || 30,
      reason: formData.get("reason"),
      price: formData.get("price") || undefined,
      paymentStatus: formData.get("paymentStatus") || undefined,
    });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos de la cita", fieldErrors };
  }

  const revalidateTarget = String(formData.get("revalidateTarget") ?? "/citas");
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      staff_id: parsed.data.staffId,
      scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
      duration_minutes: parsed.data.durationMinutes,
      reason: parsed.data.reason || null,
      price_cents: parsed.data.price !== undefined ? Math.round(parsed.data.price * 100) : null,
      payment_status: parsed.data.paymentStatus ?? "unpaid",
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(revalidateTarget);
  revalidatePath("/citas");
  return {};
}

/** Marca rápidamente una cita como pagada/no pagada, sin abrir el diálogo completo de edición. */
export async function updatePaymentStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const paymentStatus = formData.get("paymentStatus") as "unpaid" | "paid" | "waived";
  const revalidateTarget = String(formData.get("revalidateTarget") ?? "/citas");

  const supabase = await createClient();
  await supabase.from("appointments").update({ payment_status: paymentStatus }).eq("id", id);

  revalidatePath(revalidateTarget);
  revalidatePath("/citas");
  revalidatePath("/dashboard");
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
  const { data: appointment } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("patient_id, staff_id, scheduled_at, duration_minutes, reason")
    .single();

  if (appointment && (status === "confirmed" || status === "cancelled")) {
    const tenant = await getCurrentTenant();
    if (tenant) await notifyAppointment(supabase, status, tenant.name, appointment);
  }

  revalidatePath(revalidateTarget);
  revalidatePath("/citas");
  revalidatePath("/portal/citas");
}
