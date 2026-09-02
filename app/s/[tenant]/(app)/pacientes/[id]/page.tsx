import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";
import { getBusySlots } from "@/lib/queries/appointments";
import { getAvailabilityMap } from "@/lib/queries/availability";
import { invitePatientToPortal } from "@/lib/actions/patients";
import { createAppointment } from "@/lib/actions/appointments";
import { AppointmentScheduler } from "@/components/appointment-scheduler";
import { AppointmentStatusActions } from "@/components/appointment-status-actions";
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
import { DeletePatientButton } from "@/components/delete-patient-button";
import { ClinicalRecordForm } from "@/components/clinical-record-form";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";
import { getAuthenticatedAssetUrl } from "@/lib/cloudinary/signed-url";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: subdomain, id } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!patient) notFound();

  const staffOptions = await getClinicalStaff(tenant.id);

  const [{ data: appointments }, { data: records }, { data: attachments }, busySlots, availabilityByStaff] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("patient_id", id)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("clinical_records")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("attachments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      getBusySlots(tenant.id),
      getAvailabilityMap(tenant.id, staffOptions.map((s) => s.userId)),
    ]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{patient.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[patient.email, patient.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patient.user_id && <Badge variant="outline">Con acceso al portal</Badge>}
          {!patient.user_id && patient.email && (
            <form
              action={async () => {
                "use server";
                await invitePatientToPortal(patient.id);
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Invitar al portal
              </Button>
            </form>
          )}
          <Button variant="outline" size="sm" render={<Link href={`/pacientes/${id}/editar`}>Editar</Link>} />
          <DeletePatientButton patientId={id} />
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Citas</h2>
          <div className="mt-4 space-y-3">
            {appointments?.map((appt) => (
              <div key={appt.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(appt.scheduled_at).toLocaleString("es")}
                  </p>
                  <Badge variant="outline">{STATUS_LABEL[appt.status]}</Badge>
                </div>
                {appt.reason && <p className="mt-1 text-sm text-muted-foreground">{appt.reason}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <AppointmentStatusActions
                    appointmentId={appt.id}
                    status={appt.status}
                    revalidateTarget={`/pacientes/${id}`}
                  />
                  {appt.status !== "cancelled" && appt.status !== "completed" && (
                    <EditAppointmentDialog
                      appointmentId={appt.id}
                      staffId={appt.staff_id}
                      scheduledAt={appt.scheduled_at}
                      durationMinutes={appt.duration_minutes}
                      reason={appt.reason}
                      staffOptions={staffOptions}
                      revalidateTarget={`/pacientes/${id}`}
                    />
                  )}
                </div>
              </div>
            ))}
            {(!appointments || appointments.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin citas registradas.</p>
            )}
          </div>

          <Separator className="my-6" />
          <h3 className="text-sm font-medium">Agendar nueva cita</h3>
          <div className="mt-3">
            <AppointmentScheduler
              staffOptions={staffOptions}
              busySlots={busySlots}
              availabilityByStaff={availabilityByStaff}
              action={createAppointment}
              hiddenFields={{ patientId: id }}
              submitLabel="Agendar cita"
              pendingLabel="Agendando…"
              allowDurationSelect
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium">Historial clínico</h2>
          <div className="mt-4 space-y-3">
            {records?.map((record) => (
              <div key={record.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{record.summary}</p>
                  {record.visible_to_patient && <Badge>Visible al paciente</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {record.record_type} · {new Date(record.created_at).toLocaleString("es")}
                </p>
                {"notes" in record.content && typeof record.content.notes === "string" && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">{record.content.notes}</p>
                )}
              </div>
            ))}
            {(!records || records.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin entradas de historial.</p>
            )}
          </div>

          <Separator className="my-6" />
          <h3 className="text-sm font-medium">Nueva entrada de historial</h3>
          <div className="mt-3">
            <ClinicalRecordForm patientId={id} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Documentos</h2>
        <div className="mt-4 space-y-2">
          {attachments?.map((attachment) => (
            <a
              key={attachment.id}
              href={getAuthenticatedAssetUrl(attachment.cloudinary_public_id, attachment.resource_type)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border p-3 text-sm hover:bg-accent"
            >
              {attachment.original_filename ?? attachment.cloudinary_public_id}
            </a>
          ))}
          {(!attachments || attachments.length === 0) && (
            <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
          )}
        </div>
        <div className="mt-4 max-w-md">
          <AttachmentUploadForm patientId={id} />
        </div>
      </section>
    </div>
  );
}
