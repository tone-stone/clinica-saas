import { createClient } from "@/lib/supabase/server";

export interface StaffOption {
  userId: string;
  fullName: string | null;
  email: string | null;
}

/** Miembros con rol clínico (owner o staff doctor/psicólogo) — quienes pueden atender citas. */
export async function getClinicalStaff(tenantId: string): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, staff_role")
    .eq("tenant_id", tenantId);

  const clinicalStaff = (memberships ?? []).filter(
    (m) => m.role === "owner" || m.staff_role === "doctor" || m.staff_role === "psicologo"
  );
  if (clinicalStaff.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      clinicalStaff.map((m) => m.user_id)
    );

  return clinicalStaff.map((m) => {
    const profile = profiles?.find((p) => p.id === m.user_id);
    return {
      userId: m.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });
}
