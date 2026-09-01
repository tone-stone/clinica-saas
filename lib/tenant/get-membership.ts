import { createClient } from "@/lib/supabase/server";
import type { MembershipRole, StaffRole } from "@/lib/supabase/database.types";

export interface CurrentMembership {
  userId: string;
  role: MembershipRole;
  staffRole: StaffRole | null;
}

/** Membresía del usuario autenticado (según su sesión) para un tenant dado. Respeta RLS. */
export async function getCurrentMembership(tenantId: string): Promise<CurrentMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("role, staff_role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return { userId: user.id, role: data.role, staffRole: data.staff_role };
}
