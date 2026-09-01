import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getActivePlans } from "@/lib/queries/plans";

export default async function LandingPage() {
  const plans = await getActivePlans();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          El sistema todo-en-uno para tu consultorio médico o psicológico
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Agenda de citas, pacientes, historiales clínicos y reportes en una sola
          plataforma. Cada clínica con su propio espacio, seguro y aislado.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button size="lg" render={<Link href="/registro">Crear mi clínica</Link>} />
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/precios">Ver precios</Link>}
          />
        </div>
      </section>

      {plans && plans.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border p-6 text-center">
                <h2 className="text-lg font-medium">{plan.name}</h2>
                <p className="mt-2 text-3xl font-semibold">
                  ${(plan.price_cents / 100).toLocaleString("es")}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval === "year" ? "año" : "mes"}
                  </span>
                </p>
                <Button className="mt-6 w-full" render={<Link href="/registro">Comenzar</Link>} />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
