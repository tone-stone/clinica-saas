import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getOwnPatientRecord } from "@/lib/queries/portal";
import { getClinicalStaff } from "@/lib/queries/staff";
import { getBusySlots } from "@/lib/queries/appointments";
import { getAvailabilityMap } from "@/lib/queries/availability";
import { requestAppointment, updateAppointmentStatus } from "@/lib/actions/appointments";
import { AppointmentScheduler } from "@/components/appointment-scheduler";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export default async function PortalAppointmentsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const patient = await getOwnPatientRecord(tenant.id);
  if (!patient) {
    return <p className="text-muted-foreground">No se encontró tu ficha de paciente.</p>;
  }

  const staffOptions = await getClinicalStaff(tenant.id);

  const supabase = await createClient();
  const [{ data: appointments }, busySlots, availabilityByStaff] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("patient_id", patient.id)
      .order("scheduled_at", { ascending: false }),
    getBusySlots(tenant.id),
    getAvailabilityMap(tenant.id, staffOptions.map((s) => s.userId)),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Mis citas</h1>
      <div className="mt-6 space-y-3">
        {appointments?.map((appt) => (
          <div key={appt.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{new Date(appt.scheduled_at).toLocaleString("es")}</p>
              <Badge variant="outline">{STATUS_LABEL[appt.status]}</Badge>
            </div>
            {appt.reason && <p className="mt-1 text-sm text-muted-foreground">{appt.reason}</p>}
            {(appt.status === "pending" || appt.status === "confirmed") && (
              <form action={updateAppointmentStatus} className="mt-3">
                <input type="hidden" name="id" value={appt.id} />
                <input type="hidden" name="status" value="cancelled" />
                <input type="hidden" name="revalidateTarget" value="/portal/citas" />
                <Button type="submit" size="sm" variant="outline">
                  Cancelar cita
                </Button>
              </form>
            )}
          </div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="text-sm text-muted-foreground">No tienes citas registradas.</p>
        )}
      </div>

      <Separator className="my-8" />
      <h2 className="text-lg font-medium">Solicitar una cita</h2>
      <div className="mt-4">
        <AppointmentScheduler
          staffOptions={staffOptions}
          busySlots={busySlots}
          availabilityByStaff={availabilityByStaff}
          action={requestAppointment}
          submitLabel="Solicitar cita"
          pendingLabel="Enviando…"
        />
      </div>
    </div>
  );
}
