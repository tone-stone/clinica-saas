import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [{ count: patientCount }, { count: todayCount }] = await Promise.all([
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", endOfDay.toISOString())
      .neq("status", "cancelled"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Panel</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Pacientes registrados</p>
          <p className="mt-2 text-3xl font-semibold">{patientCount ?? 0}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Citas de hoy</p>
          <p className="mt-2 text-3xl font-semibold">{todayCount ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
