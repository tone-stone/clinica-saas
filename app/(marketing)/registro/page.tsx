import { SignupForm } from "@/components/signup-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site-header";
import { getActivePlans } from "@/lib/queries/plans";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [plans, { plan }] = await Promise.all([getActivePlans(), searchParams]);

  return (
    <main className="mx-auto flex-1 px-6 py-16" style={{ maxWidth: 480 }}>
      <div className="flex justify-center">
        <Logo />
      </div>
      <Card className="mt-8 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Crea tu clínica</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          En un par de minutos tendrás tu propio espacio para gestionar citas, pacientes e
          historiales clínicos.
        </p>
        <div className="mt-8">
          <SignupForm plans={plans} defaultPlanId={plan} />
        </div>
      </Card>
    </main>
  );
}
