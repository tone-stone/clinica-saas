import { headers } from "next/headers";
import { getTenantBySubdomain } from "./get-tenant";

/**
 * Tenant del subdominio actual, leído del header que el middleware inyecta a
 * partir del host. Usar dentro de Server Actions (que no reciben `params` de
 * ruta) para resolver a qué clínica pertenece la operación.
 *
 * Importante: RLS solo garantiza que un usuario no pueda leer/escribir tenants
 * a los que no pertenece — si pertenece a varios, toda consulta debe además
 * filtrar explícitamente por este tenant_id para no mezclar datos entre ellos.
 */
export async function getCurrentTenant() {
  const headerList = await headers();
  const subdomain = headerList.get("x-tenant-subdomain");
  if (!subdomain) return null;
  return getTenantBySubdomain(subdomain);
}
