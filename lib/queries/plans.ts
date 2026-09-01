import { createClient } from "@/lib/supabase/server";

export async function getActivePlans() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });
  return data ?? [];
}
