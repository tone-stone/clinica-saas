import Link from "next/link";
import { ChevronLeft, ChevronRight, ListPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";
import { AppointmentChip } from "@/components/appointment-chip";
import { updateWaitlistStatus } from "@/lib/actions/waitlist";
import { addMonths, dateKey, getMonthGridDays, monthKey, parseMonthParam } from "@/lib/scheduling";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS_PER_DAY = 4;

const STATUS_LEGEND = [
  { label: "Pendiente", className: "bg-muted" },
  { label: "Confirmada", className: "bg-accent" },
  { label: "Completada", className: "bg-secondary" },
  { label: "Cancelada / no asistió", className: "bg-destructive/10" },
];

export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ tenant: subdomain }, { month }] = await Promise.all([params, searchParams]);
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const monthStart = parseMonthParam(month);
  const gridDays = getMonthGridDays(monthStart);
  const rangeStart = gridDays[0];
  const rangeEnd = gridDays[gridDays.length - 1];
  const rangeEndExclusive = new Date(rangeEnd);
  rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);

  const supabase = await createClient();
  const [{ data: appointments }, staffOptions, { data: waitlist }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, email, phone)")
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", rangeStart.toISOString())
      .lt("scheduled_at", rangeEndExclusive.toISOString())
      .order("scheduled_at", { ascending: true }),
    getClinicalStaff(tenant.id),
    supabase
      .from("waitlist_entries")
      .select("*, patients(full_name)")
      .eq("tenant_id", tenant.id)
      .eq("status", "waiting")
      .order("created_at", { ascending: true }),
  ]);

  const appointmentIds = (appointments ?? []).map((a) => a.id);
  const { data: intakeEntries } =
    appointmentIds.length > 0
      ? await supabase
          .from("appointment_intake")
          .select("appointment_id, motivo, sintomas, severidad")
          .in("appointment_id", appointmentIds)
      : { data: [] };
  const intakeByAppointmentId = new Map((intakeEntries ?? []).map((i) => [i.appointment_id, i]));

  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  const appointmentsByDay = new Map<string, NonNullable<typeof appointments>>();
  for (const appt of appointments ?? []) {
    const key = dateKey(new Date(appt.scheduled_at));
    const list = appointmentsByDay.get(key) ?? [];
    list.push(appt);
    appointmentsByDay.set(key, list);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthLabel = monthStart.toLocaleDateString("es", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Citas</h1>
        <Button
          size="sm"
          variant="outline"
          render={
            <Link href="/pacientes">
              <Users className="size-4" />
              Agendar para un paciente
            </Link>
          }
        />
      </div>

      {waitlist && waitlist.length > 0 && (
        <Card className="mt-6 gap-3 p-4">
          <div className="flex items-center gap-2">
            <ListPlus className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-medium">
              Lista de espera <Badge variant="secondary">{waitlist.length}</Badge>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {waitlist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{entry.patients?.full_name ?? "Paciente"}</span>
                {entry.note && (
                  <span className="max-w-40 truncate text-xs text-muted-foreground">
                    {entry.note}
                  </span>
                )}
                <form action={updateWaitlistStatus}>
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="status" value="resolved" />
                  <button type="submit" className="text-xs text-primary hover:underline">
                    Resuelto
                  </button>
                </form>
                <form action={updateWaitlistStatus}>
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button type="submit" className="text-xs text-muted-foreground hover:underline">
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              render={
                <Link
                  href={`/citas?month=${monthKey(addMonths(monthStart, -1))}`}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="size-4" />
                </Link>
              }
            />
            <h2 className="w-48 text-center text-lg font-semibold capitalize tracking-tight">
              {monthLabel}
            </h2>
            <Button
              size="icon-sm"
              variant="outline"
              render={
                <Link
                  href={`/citas?month=${monthKey(addMonths(monthStart, 1))}`}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/citas?month=${monthKey(new Date())}`}>Hoy</Link>}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {STATUS_LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${item.className}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs font-medium text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="bg-muted/40 px-2 py-2 text-center">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-t-0 bg-border">
          {gridDays.map((day) => {
            const key = dateKey(day);
            const dayAppointments = appointmentsByDay.get(key) ?? [];
            const isToday = key === dateKey(today);
            const isOutsideMonth = day.getMonth() !== monthStart.getMonth();
            const visible = dayAppointments.slice(0, MAX_CHIPS_PER_DAY);
            const extra = dayAppointments.length - visible.length;

            return (
              <div
                key={key}
                className={`flex min-h-32 flex-col gap-1 bg-card p-1.5 sm:min-h-36 ${
                  isOutsideMonth ? "bg-muted/20" : ""
                }`}
              >
                <span
                  className={`self-end rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isOutsideMonth
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {visible.map((appt) => (
                    <AppointmentChip
                      key={appt.id}
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
                    />
                  ))}
                  {extra > 0 && (
                    <p className="px-1.5 text-[11px] text-muted-foreground">+{extra} más</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
