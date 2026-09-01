import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getActivePlans } from "@/lib/queries/plans";

export default async function PricingPage() {
  const plans = await getActivePlans();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-24">
      <h1 className="text-center text-3xl font-semibold">Precios</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Suscripción anual, sin sorpresas. Cancela cuando quieras.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border p-6 text-center">
            <h2 className="text-lg font-medium">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold">
              ${(plan.price_cents / 100).toLocaleString("es")}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.interval === "year" ? "año" : "mes"}
              </span>
            </p>
            {(plan.max_staff || plan.max_patients) && (
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.max_staff ? `Hasta ${plan.max_staff} profesionales` : ""}
                {plan.max_staff && plan.max_patients ? " · " : ""}
                {plan.max_patients ? `Hasta ${plan.max_patients} pacientes` : ""}
              </p>
            )}
            <Button
              className="mt-6 w-full"
              render={<Link href={`/registro?plan=${plan.id}`}>Comenzar</Link>}
            />
          </div>
        ))}
        {plans.length === 0 && (
          <p className="col-span-2 text-center text-muted-foreground">
            Aún no hay planes configurados. Crea uno en la tabla `plans` de Supabase.
          </p>
        )}
      </div>
    </main>
  );
}
