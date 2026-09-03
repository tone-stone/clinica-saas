import { SignupForm } from "@/components/signup-form";
import { AuthShell } from "@/components/auth-shell";
import { BILLING_ENABLED } from "@/lib/billing/config";
import { getActivePlans } from "@/lib/queries/plans";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [plans, { plan }] = await Promise.all([getActivePlans(), searchParams]);

  return (
    <AuthShell
      title="Crea tu clínica"
      subtitle="En un par de minutos tendrás tu propio espacio para gestionar citas, pacientes e historiales clínicos."
      backHref="/"
      backLabel="Volver al inicio"
    >
      <SignupForm plans={plans} defaultPlanId={plan} billingEnabled={BILLING_ENABLED} />
    </AuthShell>
  );
}
