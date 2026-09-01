import { redirect } from "next/navigation";
import { getTenantBySubdomain, tenantHasAppAccess } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) redirect("/login");

  const membership = await getCurrentMembership(tenant.id);
  if (!membership) redirect("/login");

  if (!tenantHasAppAccess(tenant)) redirect("/suscripcion-inactiva");

  return (
    <AppShell tenantName={tenant.name} role={membership.role}>
      {children}
    </AppShell>
  );
}
