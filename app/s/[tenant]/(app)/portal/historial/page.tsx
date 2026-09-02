import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConsentSignDialog } from "@/components/consent-sign-dialog";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getOwnPatientRecord } from "@/lib/queries/portal";

export default async function PortalHistoryPage({
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

  const supabase = await createClient();
  // RLS ya filtra a solo las entradas con visible_to_patient = true.
  const [{ data: records }, { data: consents }] = await Promise.all([
    supabase
      .from("clinical_records")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("consents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Mi historial</h1>
      <div className="mt-6 space-y-3">
        {records?.map((record) => (
          <div key={record.id} className="rounded-lg border p-4">
            <p className="font-medium">{record.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {record.record_type} · {new Date(record.created_at).toLocaleString("es")}
            </p>
            {"notes" in record.content && typeof record.content.notes === "string" && (
              <p className="mt-2 whitespace-pre-wrap text-sm">{record.content.notes}</p>
            )}
          </div>
        ))}
        {(!records || records.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Tu clínica aún no ha compartido entradas de tu historial contigo.
          </p>
        )}
      </div>

      <Separator className="my-8" />
      <h2 className="text-lg font-medium">Consentimientos</h2>
      <div className="mt-4 space-y-3">
        {consents?.map((consent) => (
          <div key={consent.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{consent.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {consent.signed_at
                  ? `Firmado el ${new Date(consent.signed_at).toLocaleDateString("es")}`
                  : "Pendiente de tu firma"}
              </p>
            </div>
            {consent.signed_at ? (
              <Badge variant="secondary">Firmado</Badge>
            ) : (
              <ConsentSignDialog consentId={consent.id} title={consent.title} body={consent.body} />
            )}
          </div>
        ))}
        {(!consents || consents.length === 0) && (
          <p className="text-sm text-muted-foreground">No tienes consentimientos pendientes.</p>
        )}
      </div>
    </div>
  );
}
