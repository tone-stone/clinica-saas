"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";

const consentSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(2, "Ingresa un título"),
  body: z.string().min(10, "El contenido es muy corto"),
});

export interface ConsentFormState {
  error?: string;
  success?: boolean;
}

/** Staff redacta un consentimiento informado para que el paciente lo firme. */
export async function createConsent(
  _prevState: ConsentFormState,
  formData: FormData
): Promise<ConsentFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const parsed = consentSchema.safeParse({
    patientId: formData.get("patientId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Revisa los datos del formulario" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("consents").insert({
    tenant_id: tenant.id,
    patient_id: parsed.data.patientId,
    title: parsed.data.title,
    body: parsed.data.body,
    created_by: user?.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/pacientes/${parsed.data.patientId}`);
  return { success: true };
}

const signSchema = z.object({
  consentId: z.string().uuid(),
  signedName: z.string().min(2, "Escribe tu nombre completo para firmar"),
});

/** El paciente "firma" (nombre tecleado + timestamp) su propio consentimiento. */
export async function signConsent(
  _prevState: ConsentFormState,
  formData: FormData
): Promise<ConsentFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const parsed = signSchema.safeParse({
    consentId: formData.get("consentId"),
    signedName: formData.get("signedName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("consents")
    .update({ signed_name: parsed.data.signedName, signed_at: new Date().toISOString() })
    .eq("id", parsed.data.consentId);
  if (error) return { error: error.message };

  revalidatePath("/portal/historial");
  return { success: true };
}
