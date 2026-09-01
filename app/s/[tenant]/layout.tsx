import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";

// Solo resuelve el tenant por subdominio. La autenticación, membresía y el
// estado de suscripción se validan en app/s/[tenant]/(app)/layout.tsx —
// mantenerlo separado evita loops de redirect en /login, /blog, etc.
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  return <>{children}</>;
}
