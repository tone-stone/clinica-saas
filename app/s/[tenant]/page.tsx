import { redirect } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";

export default async function TenantRootPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) redirect("/login");

  const membership = await getCurrentMembership(tenant.id);
  if (!membership) redirect("/login");

  redirect(membership.role === "patient" ? "/portal/citas" : "/dashboard");
}
