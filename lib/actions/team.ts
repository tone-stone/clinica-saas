"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";

const inviteSchema = z.object({
  email: z.string().email("Correo inválido"),
  fullName: z.string().min(2, "Ingresa el nombre"),
  staffRole: z.enum(["doctor", "psicologo", "recepcion"]),
});

export interface InviteState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Usa el correo de invitación propio de Supabase Auth (SMTP incluido en el
// proyecto). El usuario queda creado de inmediato: no hace falta esperar a
// que acepte para poder asignarle la membresía.
export async function inviteStaffMember(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No se pudo determinar la clínica" };

  const membership = await getCurrentMembership(tenant.id);
  if (!membership || membership.role !== "owner") {
    return { error: "Solo el dueño de la clínica puede invitar personal" };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    staffRole: formData.get("staffRole"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Revisa los datos del formulario", fieldErrors };
  }

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { data: { full_name: parsed.data.fullName } }
  );
  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "No se pudo invitar a esta persona" };
  }

  const { error: membershipError } = await admin.from("memberships").insert({
    tenant_id: tenant.id,
    user_id: invited.user.id,
    role: "staff",
    staff_role: parsed.data.staffRole,
  });
  if (membershipError) return { error: membershipError.message };

  revalidatePath("/equipo");
  return {};
}
