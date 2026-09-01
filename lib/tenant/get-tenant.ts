import { cache } from "react";
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

/**
 * Busca el tenant por subdominio usando el cliente admin (bypass RLS).
 * Necesario porque esta consulta ocurre antes de que exista sesión (ej. página
 * de login) o para decidir si la app debe bloquear el acceso por suscripción.
 * cache() evita repetir la consulta si layout y page la llaman en el mismo request.
 */
export const getTenantBySubdomain = cache(async (subdomain: string): Promise<Tenant | null> => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("subdomain", subdomain)
    .maybeSingle();

  return data;
});

/** past_due se tolera como margen de gracia; canceled/incomplete bloquean el acceso. */
export function tenantHasAppAccess(tenant: Tenant): boolean {
  return ACTIVE_STATUSES.has(tenant.subscription_status);
}
