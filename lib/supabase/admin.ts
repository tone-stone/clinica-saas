import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la service role key: ignora RLS por completo.
// Uso exclusivo en código de servidor de confianza (alta de tenant, webhooks
// de Stripe, resolución de tenant por subdominio antes de que exista sesión).
// Nunca importar desde un componente cliente ni exponer esta key al browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
