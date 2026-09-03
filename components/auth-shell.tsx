import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/site-header";

const HIGHLIGHTS = [
  "Agenda de citas sin choques de horario",
  "Pacientes e historiales clínicos en un solo lugar",
  "Cada clínica en su espacio, seguro y aislado",
];

/**
 * Layout de dos paneles para las pantallas de acceso (login / registro):
 * panel de marca a la izquierda (solo en pantallas grandes) y el formulario
 * a la derecha, con navegación de regreso y enlace contextual.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref = "/",
  backLabel = "Volver al inicio",
  headerAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-primary px-12 py-14 text-primary-foreground lg:flex lg:w-[44%] lg:max-w-lg lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5 blur-3xl"
        />
        <Logo variant="sidebar" className="relative" />
        <div className="relative">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            El sistema todo-en-uno para tu consultorio médico o psicológico
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-primary-foreground/80"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Diseñado para consultorios de neuropsicología y salud mental
        </p>
      </aside>

      <div className="flex flex-1 flex-col px-6 py-8 sm:px-12">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
          {headerAction ? <div className="text-sm">{headerAction}</div> : null}
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
