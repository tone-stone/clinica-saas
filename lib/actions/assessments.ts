"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import { SCALES } from "@/lib/assessments/scales";
import type { ScaleType } from "@/lib/supabase/database.types";

const assessmentSchema = z.object({
  patientId: z.string().uuid(),
  scaleType: z.enum(["phq9", "gad7"]),
  answers: z.array(z.coerce.number().int().min(0).max(3)),
});

export interface AssessmentFormState {
  error?: string;
  success?: boolean;
}

export async function createAssessment(
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const scaleType = formData.get("scaleType") as ScaleType;
  const scale = SCALES[scaleType];
  if (!scale) return { error: "Escala inválida" };

  const answers = scale.questions.map((_, i) => formData.get(`answer_${i}`));

  const parsed = assessmentSchema.safeParse({
    patientId: formData.get("patientId"),
    scaleType,
    answers,
  });
  if (!parsed.success) {
    return { error: "Responde todas las preguntas antes de guardar" };
  }
  if (parsed.data.answers.length !== scale.questions.length) {
    return { error: "Responde todas las preguntas antes de guardar" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const score = parsed.data.answers.reduce((sum, value) => sum + value, 0);

  const { error } = await supabase.from("assessments").insert({
    tenant_id: tenant.id,
    patient_id: parsed.data.patientId,
    staff_id: user.id,
    scale_type: parsed.data.scaleType,
    answers: parsed.data.answers,
    score,
  });
  if (error) return { error: error.message };

  revalidatePath(`/pacientes/${parsed.data.patientId}`);
  return { success: true };
}
