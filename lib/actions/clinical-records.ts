"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import type { ClinicalRecordType } from "@/lib/supabase/database.types";

const recordSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().optional(),
  recordType: z.enum(["general", "medicina", "psicologia"]),
  summary: z.string().min(2, "Ingresa un resumen"),
  notes: z.string().optional(),
  visibleToPatient: z.string().optional(),
});

export interface ClinicalRecordFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// clinical_records es append-only por diseño (sin policy de UPDATE/DELETE en la
// base de datos): las correcciones se hacen creando una nueva entrada.
export async function createClinicalRecord(
  _prevState: ClinicalRecordFormState,
  formData: FormData
): Promise<ClinicalRecordFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const parsed = recordSchema.safeParse({
    patientId: formData.get("patientId"),
    appointmentId: formData.get("appointmentId") || undefined,
    recordType: formData.get("recordType"),
    summary: formData.get("summary"),
    notes: formData.get("notes"),
    visibleToPatient: formData.get("visibleToPatient") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos de la entrada", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const { error } = await supabase.from("clinical_records").insert({
    tenant_id: tenant.id,
    patient_id: parsed.data.patientId,
    appointment_id: parsed.data.appointmentId || null,
    staff_id: user.id,
    record_type: parsed.data.recordType as ClinicalRecordType,
    summary: parsed.data.summary,
    content: parsed.data.notes ? { notes: parsed.data.notes } : {},
    visible_to_patient: parsed.data.visibleToPatient === "on",
  });
  if (error) return { error: error.message };

  revalidatePath(`/pacientes/${parsed.data.patientId}`);
  redirect(`/pacientes/${parsed.data.patientId}`);
}
