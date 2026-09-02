import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";

export default async function EditPatientPage({
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

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Editar paciente</h1>
      <div className="mt-6">
        <PatientForm patient={patient} />
      </div>
    </div>
  );
}
