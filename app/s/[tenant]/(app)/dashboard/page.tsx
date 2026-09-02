import { Calendar, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="flex-row items-center gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Pacientes registrados</p>
            <p className="mt-1 text-3xl font-semibold">{patientCount ?? 0}</p>
          </div>
        </Card>
        <Card className="flex-row items-center gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Calendar className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Citas de hoy</p>
            <p className="mt-1 text-3xl font-semibold">{todayCount ?? 0}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
