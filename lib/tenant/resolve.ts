/**
 * Extrae el subdominio de un hostname dado el dominio raíz de la app.
 * Devuelve null para el dominio raíz, "www", o un dominio propio (custom domain,
 * que se resuelve por otra vía en fase 2).
 */
export function extractSubdomain(hostname: string, rootDomain: string): string | null {
  const host = hostname.split(":")[0];
  const root = rootDomain.split(":")[0];

  if (host === root || host === `www.${root}`) return null;
  if (!host.endsWith(`.${root}`)) return null;

  const subdomain = host.slice(0, -(`.${root}`.length));
  if (!subdomain || subdomain.includes(".")) return null;

  return subdomain;
}
