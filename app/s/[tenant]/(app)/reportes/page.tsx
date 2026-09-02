import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-1 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

const MONTH_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const supabase = await createClient();
  const [{ data: monthAppointments }, { data: trendAppointments }, staffOptions] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("status, staff_id, patient_id, price_cents, payment_status")
        .eq("tenant_id", tenant.id)
        .gte("scheduled_at", monthStart.toISOString())
        .lt("scheduled_at", monthEnd.toISOString()),
      supabase
        .from("appointments")
        .select("scheduled_at, status")
        .eq("tenant_id", tenant.id)
        .gte("scheduled_at", trendStart.toISOString())
        .lt("scheduled_at", monthEnd.toISOString()),
      getClinicalStaff(tenant.id),
    ]);

  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  const total = monthAppointments?.length ?? 0;
  const cancelled = monthAppointments?.filter((a) => a.status === "cancelled").length ?? 0;
  const noShow = monthAppointments?.filter((a) => a.status === "no_show").length ?? 0;
  const patientsSeen = new Set(
    (monthAppointments ?? [])
      .filter((a) => a.status === "completed")
      .map((a) => a.patient_id)
  ).size;
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  const incomeCents = (monthAppointments ?? [])
    .filter((a) => a.payment_status === "paid")
    .reduce((sum, a) => sum + (a.price_cents ?? 0), 0);
  const pendingCents = (monthAppointments ?? [])
    .filter((a) => a.payment_status === "unpaid" && a.price_cents != null && a.status !== "cancelled")
    .reduce((sum, a) => sum + (a.price_cents ?? 0), 0);

  const perStaff = new Map<string, number>();
  for (const appt of monthAppointments ?? []) {
    if (appt.status === "cancelled") continue;
    perStaff.set(appt.staff_id, (perStaff.get(appt.staff_id) ?? 0) + 1);
  }
  const staffBreakdown = [...perStaff.entries()]
    .map(([staffId, count]) => ({ name: staffNameById.get(staffId) ?? "Profesional", count }))
    .sort((a, b) => b.count - a.count);
  const maxStaffCount = Math.max(1, ...staffBreakdown.map((s) => s.count));

  const trendByMonth = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    trendByMonth.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const appt of trendAppointments ?? []) {
    if (appt.status === "cancelled") continue;
    const d = new Date(appt.scheduled_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (trendByMonth.has(key)) trendByMonth.set(key, (trendByMonth.get(key) ?? 0) + 1);
  }
  const trend = [...trendByMonth.entries()].map(([key, count]) => {
    const [, month] = key.split("-").map(Number);
    return { label: MONTH_NAMES[month], count };
  });
  const maxTrendCount = Math.max(1, ...trend.map((t) => t.count));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mes actual: {monthStart.toLocaleDateString("es", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Citas este mes" value={String(total)} />
        <StatTile label="Pacientes atendidos" value={String(patientsSeen)} />
        <StatTile label="Tasa de cancelación" value={`${cancelRate}%`} />
        <StatTile label="Tasa de no asistencia" value={`${noShowRate}%`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatTile label="Ingresos cobrados este mes" value={`$${(incomeCents / 100).toLocaleString("es")}`} />
        <StatTile label="Por cobrar este mes" value={`$${(pendingCents / 100).toLocaleString("es")}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="font-heading font-medium">Citas por profesional (este mes)</h2>
          <div className="space-y-3">
            {staffBreakdown.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-medium tabular-nums">{s.count}</span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(s.count / maxStaffCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {staffBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin citas registradas este mes.</p>
            )}
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-heading font-medium">Tendencia de citas (últimos 6 meses)</h2>
          <div className="flex h-40 items-end gap-3 px-1">
            {trend.map((month) => (
              <div key={month.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {month.count}
                </span>
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-sm bg-primary"
                    style={{
                      height: `${Math.max(4, (month.count / maxTrendCount) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground capitalize">{month.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
