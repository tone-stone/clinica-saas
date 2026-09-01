import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/lib/actions/billing";

export default async function InactiveSubscriptionPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  const membership = tenant ? await getCurrentMembership(tenant.id) : null;

  return (
    <main className="mx-auto flex flex-1 flex-col items-center justify-center px-6 text-center" style={{ maxWidth: 480 }}>
      <h1 className="text-2xl font-semibold">Suscripción inactiva</h1>
      <p className="mt-3 text-muted-foreground">
        {membership?.role === "owner"
          ? "La suscripción de tu clínica no está activa. Actualiza tu método de pago para recuperar el acceso."
          : "El acceso a esta clínica está temporalmente suspendido. Contacta al administrador de tu clínica."}
      </p>
      {membership?.role === "owner" && (
        <form action={openBillingPortal} className="mt-6">
          <Button type="submit">Gestionar suscripción</Button>
        </form>
      )}
    </main>
  );
}
