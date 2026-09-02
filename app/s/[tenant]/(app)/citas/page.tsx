import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";
import { AppointmentStatusActions } from "@/components/appointment-status-actions";
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
import { addDays, dateKey, parseDateParam } from "@/lib/scheduling";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

const STATUS_VARIANT: Record<AppointmentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const STRIP_DAYS = 14;

export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ tenant: subdomain }, { date }] = await Promise.all([params, searchParams]);
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const selectedDay = parseDateParam(date);
  const nextDay = addDays(selectedDay, 1);

  const supabase = await createClient();
  const [{ data: appointments }, staffOptions] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(id, full_name)")
      .eq("tenant_id", tenant.id)
      .gte("scheduled_at", selectedDay.toISOString())
      .lt("scheduled_at", nextDay.toISOString())
      .order("scheduled_at", { ascending: true }),
    getClinicalStaff(tenant.id),
  ]);

  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const strip = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i - 3));
  const isToday = dateKey(selectedDay) === dateKey(today);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Citas</h1>
        <Button size="sm" variant="outline" render={<Link href="/pacientes">
          <Users className="size-4" />
          Agendar para un paciente
        </Link>} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button
          size="icon-sm"
          variant="outline"
          render={<Link href={`/citas?date=${dateKey(addDays(selectedDay, -1))}`} aria-label="Día anterior">
            <ChevronLeft className="size-4" />
          </Link>}
        />
        <div className="scrollbar-thin flex flex-1 gap-2 overflow-x-auto px-1 py-1">
          {strip.map((day) => {
            const active = dateKey(day) === dateKey(selectedDay);
            return (
              <Link
                key={dateKey(day)}
                href={`/citas?date=${dateKey(day)}`}
                className={`flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span className="text-[11px] uppercase opacity-80">
                  {dateKey(day) === dateKey(today)
                    ? "Hoy"
                    : day.toLocaleDateString("es", { weekday: "short" })}
                </span>
                <span className="text-base font-semibold">{day.getDate()}</span>
              </Link>
            );
          })}
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          render={<Link href={`/citas?date=${dateKey(addDays(selectedDay, 1))}`} aria-label="Día siguiente">
            <ChevronRight className="size-4" />
          </Link>}
        />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {isToday ? "Hoy, " : ""}
        {selectedDay.toLocaleDateString("es", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      <div className="mt-4 space-y-3">
        {appointments?.map((appt) => (
          <Card key={appt.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium tabular-nums">
                  {new Date(appt.scheduled_at).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({appt.duration_minutes} min)
                  </span>
                </p>
                <Link
                  href={`/pacientes/${appt.patients?.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {appt.patients?.full_name ?? "Paciente"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {staffNameById.get(appt.staff_id) ?? "Profesional"}
                  {appt.reason ? ` · ${appt.reason}` : ""}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AppointmentStatusActions
                appointmentId={appt.id}
                status={appt.status}
                revalidateTarget="/citas"
              />
              {appt.status !== "cancelled" && appt.status !== "completed" && (
                <EditAppointmentDialog
                  appointmentId={appt.id}
                  staffId={appt.staff_id}
                  scheduledAt={appt.scheduled_at}
                  durationMinutes={appt.duration_minutes}
                  reason={appt.reason}
                  staffOptions={staffOptions}
                  revalidateTarget="/citas"
                />
              )}
            </div>
          </Card>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sin citas agendadas este día.
          </p>
        )}
      </div>
    </div>
  );
}
