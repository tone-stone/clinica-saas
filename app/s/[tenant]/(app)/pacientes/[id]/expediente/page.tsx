import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getClinicalStaff } from "@/lib/queries/staff";
import { getAuthenticatedAssetUrl } from "@/lib/cloudinary/signed-url";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

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

export default async function PatientRecordExportPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: subdomain, id } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const [{ data: patient }, { data: records }, { data: appointments }, staffOptions] =
    await Promise.all([
      supabase.from("patients").select("*").eq("tenant_id", tenant.id).eq("id", id).maybeSingle(),
      supabase
        .from("clinical_records")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("patient_id", id)
        .order("scheduled_at", { ascending: false }),
      getClinicalStaff(tenant.id),
    ]);
  if (!patient) notFound();

  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  return (
    <div className="mx-auto max-w-3xl print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Expediente</h1>
        <PrintButton />
      </div>

      <div className="mt-6 space-y-8 print:mt-0">
        <section className="flex items-start gap-4 border-b pb-4 print:border-b-2 print:border-black">
          {patient.photo_public_id && (
            // eslint-disable-next-line @next/next/no-img-element -- vista de impresión: sin optimización de Next
            <img
              src={getAuthenticatedAssetUrl(patient.photo_public_id, "image")}
              alt={patient.full_name}
              className="size-20 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{tenant.name}</p>
            <h2 className="text-xl font-semibold">{patient.full_name}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Correo</dt>
              <dd>{patient.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd>{patient.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fecha de nacimiento</dt>
              <dd>
                {patient.date_of_birth
                  ? new Date(`${patient.date_of_birth}T00:00:00`).toLocaleDateString("es")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Género</dt>
              <dd>{patient.gender ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contacto de emergencia</dt>
              <dd>
                {patient.emergency_contact_name
                  ? `${patient.emergency_contact_name} · ${patient.emergency_contact_phone ?? "s/n"}`
                  : "—"}
              </dd>
            </div>
          </dl>
          </div>
        </section>

        <section>
          <h3 className="font-medium">Historial clínico</h3>
          <div className="mt-3 space-y-4">
            {records?.map((record) => {
              const entries = Object.entries(record.content).filter(
                (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0
              );
              return (
                <div key={record.id} className="rounded-lg border p-3 break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{record.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString("es")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{record.record_type}</p>
                  {entries.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {entries.map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-muted-foreground">
                            {CONTENT_FIELD_LABEL[key] ?? key}
                          </p>
                          <p className="whitespace-pre-wrap text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {(!records || records.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin entradas de historial.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-medium">Historial de citas</h3>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 font-normal">Fecha</th>
                <th className="py-1.5 font-normal">Profesional</th>
                <th className="py-1.5 font-normal">Estatus</th>
                <th className="py-1.5 font-normal">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((appt) => (
                <tr key={appt.id} className="border-b border-dashed">
                  <td className="py-1.5">{new Date(appt.scheduled_at).toLocaleString("es")}</td>
                  <td className="py-1.5">{staffNameById.get(appt.staff_id) ?? "—"}</td>
                  <td className="py-1.5">{STATUS_LABEL[appt.status]}</td>
                  <td className="py-1.5">{appt.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!appointments || appointments.length === 0) && (
            <p className="mt-2 text-sm text-muted-foreground">Sin citas registradas.</p>
          )}
        </section>
      </div>
    </div>
  );
}
