import Link from "next/link";
import { Calendar, FileText, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { getActivePlans } from "@/lib/queries/plans";

const FEATURES = [
  {
    icon: Calendar,
    title: "Agenda de citas",
    description: "Programa, confirma y da seguimiento a las citas de cada profesional sin choques de horario.",
  },
  {
    icon: Users,
    title: "Pacientes y equipo",
    description: "Un espacio ordenado para tus pacientes y tu equipo clínico, con roles y permisos claros.",
  },
  {
    icon: FileText,
    title: "Historiales clínicos",
    description: "Registra evaluaciones, notas de sesión y adjuntos en un expediente centralizado por paciente.",
  },
  {
    icon: ShieldCheck,
    title: "Aislado y seguro",
    description: "Cada clínica vive en su propio espacio, con control de acceso a nivel de datos.",
  },
];

export default async function LandingPage() {
  const plans = await getActivePlans();

  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Diseñado para consultorios de neuropsicología y salud mental
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          El sistema todo-en-uno para tu consultorio médico o psicológico
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
          Agenda de citas, pacientes, historiales clínicos y reportes en una sola
          plataforma. Cada clínica con su propio espacio, seguro y aislado.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" render={<Link href="/registro">Crear mi clínica</Link>} />
          <Button size="lg" variant="outline" render={<Link href="/precios">Ver precios</Link>} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-6">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
              </span>
              <h2 className="mt-4 font-heading text-base font-medium">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section className="border-t bg-muted/40 px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Planes</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-6 text-center">
                  <h3 className="font-heading text-lg font-medium">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-semibold">
                    ${(plan.price_cents / 100).toLocaleString("es")}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.interval === "year" ? "año" : "mes"}
                    </span>
                  </p>
                  <Button
                    className="mt-6 w-full"
                    render={<Link href={`/registro?plan=${plan.id}`}>Comenzar</Link>}
                  />
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
