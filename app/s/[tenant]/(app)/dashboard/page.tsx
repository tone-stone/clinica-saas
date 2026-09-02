import Link from "next/link";
import { Calendar, CalendarClock, UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentChip } from "@/components/appointment-chip";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_BAR_CLASS: Record<AppointmentStatus, string> = {
  pending: "bg-muted-foreground/40",
  confirmed: "bg-primary",
  completed: "bg-secondary-foreground/50",
  cancelled: "bg-destructive/50",
  no_show: "bg-destructive/50",
};

const STATUS_ORDER: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex-row items-center gap-4 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const weekEnd = new Date(startOfDay);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    { count: patientCount },
    { count: newPatientCount },
    { count: todayCount },
    { count: weekCount },
    { data: monthAppointments },
    { data: upcoming },
    { data: recentPatients },
    staffOptions,
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", endOfDay.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("appointments")
      .select("status")
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", monthStart.toISOString())
      .lt("scheduled_at", monthEnd.toISOString()),
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, email, phone)")
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", now.toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(6),
    supabase
      .from("patients")
      .select("id, full_name, email, phone, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    getClinicalStaff(tenant.id),
  ]);

  const upcomingIds = (upcoming ?? []).map((a) => a.id);
  const { data: intakeEntries } =
    upcomingIds.length > 0
      ? await supabase
          .from("appointment_intake")
          .select("appointment_id, motivo, sintomas, severidad")
          .in("appointment_id", upcomingIds)
      : { data: [] };
  const intakeByAppointmentId = new Map((intakeEntries ?? []).map((i) => [i.appointment_id, i]));

  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  const statusCounts = new Map<AppointmentStatus, number>();
  for (const appt of monthAppointments ?? []) {
    statusCounts.set(appt.status, (statusCounts.get(appt.status) ?? 0) + 1);
  }
  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((s) => statusCounts.get(s) ?? 0));
  const totalThisMonth = monthAppointments?.length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Pacientes registrados" value={patientCount ?? 0} />
        <StatCard icon={UserPlus} label="Nuevos este mes" value={newPatientCount ?? 0} />
        <StatCard icon={Calendar} label="Citas de hoy" value={todayCount ?? 0} />
        <StatCard icon={CalendarClock} label="Próximos 7 días" value={weekCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="gap-4 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-medium">Próximas citas</h2>
            <Button size="sm" variant="ghost" render={<Link href="/citas">Ver calendario</Link>} />
          </div>
          <div className="space-y-2">
            {upcoming?.map((appt) => (
              <AppointmentChip
                key={appt.id}
                variant="row"
                appointmentId={appt.id}
                patientId={appt.patients?.id ?? ""}
                patientName={appt.patients?.full_name ?? "Paciente"}
                patientEmail={appt.patients?.email ?? null}
                patientPhone={appt.patients?.phone ?? null}
                staffName={staffNameById.get(appt.staff_id) ?? "Profesional"}
                scheduledAt={appt.scheduled_at}
                durationMinutes={appt.duration_minutes}
                reason={appt.reason}
                status={appt.status}
                priceCents={appt.price_cents}
                paymentStatus={appt.payment_status}
                intake={intakeByAppointmentId.get(appt.id)}
                revalidateTarget="/dashboard"
              />
            ))}
            {(!upcoming || upcoming.length === 0) && (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Sin citas próximas.
              </p>
            )}
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-heading font-medium">Estatus de citas este mes</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = statusCounts.get(status) ?? 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${STATUS_BAR_CLASS[status]}`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{totalThisMonth} citas en total este mes</p>
        </Card>
      </div>

      <Card className="mt-4 gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-medium">Pacientes recientes</h2>
          <Button size="sm" variant="ghost" render={<Link href="/pacientes">Ver todos</Link>} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recentPatients?.map((patient) => (
            <Link
              key={patient.id}
              href={`/pacientes/${patient.id}`}
              className="rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
            >
              <p className="font-medium">{patient.full_name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[patient.email, patient.phone].filter(Boolean).join(" · ") || "Sin contacto"}
              </p>
            </Link>
          ))}
          {(!recentPatients || recentPatients.length === 0) && (
            <p className="col-span-full rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Sin pacientes registrados todavía.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
