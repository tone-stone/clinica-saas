import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CalendarClock,
  FileSignature,
  FileText,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { AssessmentForm } from "@/components/assessment-form";
import { AssessmentHistory } from "@/components/assessment-history";
import { ConsentForm } from "@/components/consent-form";
import { PatientPhotoUpload } from "@/components/patient-photo-upload";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";
import { getAuthenticatedAssetUrl } from "@/lib/cloudinary/signed-url";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const CONTENT_FIELD_LABEL: Record<string, string> = {
  notes: "Notas",
  subjetivo: "Subjetivo",
  objetivo: "Objetivo",
  analisis: "Análisis",
  plan: "Plan",
  motivo_sesion: "Motivo de la sesión",
  observaciones: "Observaciones",
  plan_tratamiento: "Plan de tratamiento",
};

function RecordContent({ content }: { content: Record<string, unknown> }) {
  const entries = Object.entries(content).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs font-medium text-muted-foreground">
            {CONTENT_FIELD_LABEL[key] ?? key}
          </p>
          <p className="whitespace-pre-wrap text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

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

  const [
    { data: appointments },
    { data: records },
    { data: attachments },
    { data: assessments },
    busySlots,
    availabilityByStaff,
  ] = await Promise.all([
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
    supabase
      .from("assessments")
      .select("id, scale_type, score, created_at")
      .eq("tenant_id", tenant.id)
      .eq("patient_id", id)
      .order("created_at", { ascending: true }),
    getBusySlots(tenant.id),
    getAvailabilityMap(tenant.id, staffOptions.map((s) => s.userId)),
  ]);

  const { data: consents } = await supabase
    .from("consents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <PatientPhotoUpload
            patientId={id}
            patientName={patient.full_name}
            photoUrl={
              patient.photo_public_id
                ? getAuthenticatedAssetUrl(patient.photo_public_id, "image")
                : null
            }
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{patient.full_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[patient.email, patient.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
            </p>
          </div>
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
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/pacientes/${id}/expediente`}>Expediente</Link>}
          />
          <Button variant="outline" size="sm" render={<Link href={`/pacientes/${id}/editar`}>Editar</Link>} />
          <DeletePatientButton patientId={id} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="flex items-center gap-2 font-heading font-medium">
            <CalendarClock className="size-4 text-muted-foreground" />
            Citas
          </h2>
          <div className="space-y-3">
            {appointments?.map((appt) => (
              <div key={appt.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(appt.scheduled_at).toLocaleString("es")}
                  </p>
                  <Badge variant="outline">{STATUS_LABEL[appt.status]}</Badge>
                </div>
                {appt.reason && <p className="mt-1 text-sm text-muted-foreground">{appt.reason}</p>}
                {appt.price_cents != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ${(appt.price_cents / 100).toLocaleString("es")} ·{" "}
                    {appt.payment_status === "paid"
                      ? "Pagado"
                      : appt.payment_status === "waived"
                        ? "Exento"
                        : "Sin pagar"}
                  </p>
                )}
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
                      priceCents={appt.price_cents}
                      paymentStatus={appt.payment_status}
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
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="flex items-center gap-2 font-heading font-medium">
            <FileText className="size-4 text-muted-foreground" />
            Historial clínico
          </h2>
          <div className="space-y-3">
            {records?.map((record) => (
              <div key={record.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{record.summary}</p>
                  {record.visible_to_patient && <Badge>Visible al paciente</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {record.record_type} · {new Date(record.created_at).toLocaleString("es")}
                </p>
                <RecordContent content={record.content} />
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
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading font-medium">
              <Activity className="size-4 text-muted-foreground" />
              Escalas clínicas
            </h2>
            <AssessmentForm patientId={id} />
          </div>
          <AssessmentHistory assessments={assessments ?? []} />
        </Card>

        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading font-medium">
              <FileSignature className="size-4 text-muted-foreground" />
              Consentimientos
            </h2>
            <ConsentForm patientId={id} />
          </div>
          <div className="space-y-2">
            {consents?.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{consent.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {consent.signed_at
                      ? `Firmado por ${consent.signed_name} el ${new Date(consent.signed_at).toLocaleDateString("es")}`
                      : "Pendiente de firma"}
                  </p>
                </div>
                <Badge variant={consent.signed_at ? "secondary" : "outline"}>
                  {consent.signed_at ? "Firmado" : "Pendiente"}
                </Badge>
              </div>
            ))}
            {(!consents || consents.length === 0) && (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Sin consentimientos registrados.
              </p>
            )}
          </div>
        </Card>
      </section>

      <Card className="gap-4 p-5">
        <h2 className="flex items-center gap-2 font-heading font-medium">
          <Paperclip className="size-4 text-muted-foreground" />
          Documentos
        </h2>
        <div className="space-y-2">
          {attachments?.map((attachment) => (
            <a
              key={attachment.id}
              href={getAuthenticatedAssetUrl(attachment.cloudinary_public_id, attachment.resource_type)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
            >
              {attachment.original_filename ?? attachment.cloudinary_public_id}
            </a>
          ))}
          {(!attachments || attachments.length === 0) && (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Sin documentos adjuntos.
            </p>
          )}
        </div>
        <div className="max-w-md">
          <AttachmentUploadForm patientId={id} />
        </div>
      </Card>
    </div>
  );
}
