"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";

const patientSchema = z.object({
  fullName: z.string().min(2, "Ingresa el nombre completo"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export interface PatientFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createPatient(
  _prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const parsed = patientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    address: formData.get("address"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos del formulario", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      tenant_id: tenant.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.dateOfBirth || null,
      gender: parsed.data.gender || null,
      address: parsed.data.address || null,
      emergency_contact_name: parsed.data.emergencyContactName || null,
      emergency_contact_phone: parsed.data.emergencyContactPhone || null,
      notes: parsed.data.notes || null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !patient) {
    return { error: error?.message ?? "No se pudo crear el paciente" };
  }

  revalidatePath("/pacientes");
  redirect(`/pacientes/${patient.id}`);
}

/** Invita al paciente a crear su cuenta del portal (correo de invitación de Supabase Auth). */
export async function invitePatientToPortal(patientId: string): Promise<{ error?: string }> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const membership = await getCurrentMembership(tenant.id);
  if (!membership || (membership.role !== "owner" && membership.role !== "staff")) {
    return { error: "No autorizado" };
  }

  const admin = createAdminClient();
  const { data: patient } = await admin
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!patient) return { error: "Paciente no encontrado" };
  if (!patient.email) return { error: "El paciente no tiene correo registrado" };
  if (patient.user_id) return { error: "El paciente ya tiene acceso al portal" };

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(patient.email, {
    data: { full_name: patient.full_name },
  });
  if (error || !invited.user) return { error: error?.message ?? "No se pudo invitar al paciente" };

  await admin.from("patients").update({ user_id: invited.user.id }).eq("id", patientId);
  await admin
    .from("memberships")
    .insert({ tenant_id: tenant.id, user_id: invited.user.id, role: "patient" });

  revalidatePath(`/pacientes/${patientId}`);
  return {};
}
