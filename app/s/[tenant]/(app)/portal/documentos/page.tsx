import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getOwnPatientRecord } from "@/lib/queries/portal";
import { getAuthenticatedAssetUrl } from "@/lib/cloudinary/signed-url";

export default async function PortalDocumentsPage({
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
  // RLS solo devuelve adjuntos ligados a una entrada de historial compartida contigo.
  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Mis documentos</h1>
      <div className="mt-6 space-y-2">
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
          <p className="text-sm text-muted-foreground">
            Tu clínica aún no ha compartido documentos contigo.
          </p>
        )}
      </div>
    </div>
  );
}
