"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";

const attachmentSchema = z.object({
  patientId: z.string().uuid(),
  clinicalRecordId: z.string().optional(),
  publicId: z.string().min(1),
  resourceType: z.enum(["image", "raw", "video"]),
  originalFilename: z.string().optional(),
});

export async function createAttachment(input: {
  patientId: string;
  clinicalRecordId?: string;
  publicId: string;
  resourceType: "image" | "raw" | "video";
  originalFilename?: string;
}): Promise<{ error?: string }> {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos de adjunto inválidos" };

  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("attachments").insert({
    tenant_id: tenant.id,
    patient_id: parsed.data.patientId,
    clinical_record_id: parsed.data.clinicalRecordId || null,
    cloudinary_public_id: parsed.data.publicId,
    resource_type: parsed.data.resourceType,
    original_filename: parsed.data.originalFilename || null,
    uploaded_by: user?.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/pacientes/${parsed.data.patientId}`);
  return {};
}
