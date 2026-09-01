import { createClient } from "@/lib/supabase/server";

export async function getOwnPatientRecord(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}
