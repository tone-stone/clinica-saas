import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { AppointmentStatusActions } from "@/components/appointment-status-actions";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name)")
    .eq("tenant_id", tenant.id)
    .order("scheduled_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Citas</h1>
      <div className="mt-6 space-y-3">
        {appointments?.map((appt) => (
          <div key={appt.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/pacientes/${appt.patients?.id}`}
                  className="font-medium hover:underline"
                >
                  {appt.patients?.full_name ?? "Paciente"}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {new Date(appt.scheduled_at).toLocaleString("es")}
                </p>
              </div>
              <Badge variant="outline">{STATUS_LABEL[appt.status]}</Badge>
            </div>
            <div className="mt-3">
              <AppointmentStatusActions
                appointmentId={appt.id}
                status={appt.status}
                revalidateTarget="/citas"
              />
            </div>
          </div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="text-sm text-muted-foreground">Sin citas registradas todavía.</p>
        )}
      </div>
    </div>
  );
}
