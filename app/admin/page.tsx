import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago atrasado",
  canceled: "Cancelada",
  incomplete: "Incompleta",
};

export default async function AdminTenantsPage() {
  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, subdomain, subscription_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Clínicas</h1>
      <div className="mt-6 space-y-2">
        {tenants?.map((tenant) => (
          <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{tenant.name}</p>
              <p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
            </div>
            <span className="text-sm">{STATUS_LABEL[tenant.subscription_status]}</span>
          </div>
        ))}
        {(!tenants || tenants.length === 0) && (
          <p className="text-sm text-muted-foreground">Aún no hay clínicas registradas.</p>
        )}
      </div>
    </div>
  );
}
