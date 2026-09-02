import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { BackLink } from "@/components/back-link";
import { getActivePlans } from "@/lib/queries/plans";

const INTERVAL_LABEL: Record<string, string> = {
  year: "año",
  semiannual: "semestre",
  month: "mes",
};

export default async function PricingPage() {
  const plans = await getActivePlans();

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-24">
        <BackLink className="mb-10" />
        <h1 className="text-center text-3xl font-semibold tracking-tight">Precios</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Elige el plan que mejor se adapte a tu clínica. Sin sorpresas, cancela cuando quieras.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-6 text-center">
              <h2 className="font-heading text-lg font-medium">{plan.name}</h2>
              <p className="mt-2 text-3xl font-semibold">
                ${(plan.price_cents / 100).toLocaleString("es")}
                <span className="text-sm font-normal text-muted-foreground">
                  /{INTERVAL_LABEL[plan.interval] ?? plan.interval}
                </span>
              </p>
              {(plan.max_staff || plan.max_patients) && (
                <ul className="mt-4 space-y-1.5 text-left text-sm text-muted-foreground">
                  {plan.max_staff && (
                    <li className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-primary" />
                      Hasta {plan.max_staff} profesionales
                    </li>
                  )}
                  {plan.max_patients && (
                    <li className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-primary" />
                      Hasta {plan.max_patients} pacientes
                    </li>
                  )}
                </ul>
              )}
              <Button
                className="mt-6 w-full"
                render={<Link href={`/registro?plan=${plan.id}`}>Comenzar</Link>}
              />
            </Card>
          ))}
          {plans.length === 0 && (
            <p className="col-span-2 text-center text-muted-foreground">
              Aún no hay planes configurados. Crea uno en la tabla `plans` de Supabase.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
