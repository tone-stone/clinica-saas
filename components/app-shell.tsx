import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import type { MembershipRole } from "@/lib/supabase/database.types";

const STAFF_NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/citas", label: "Citas" },
  { href: "/equipo", label: "Equipo" },
  { href: "/reportes", label: "Reportes" },
  { href: "/blog-admin", label: "Blog" },
];

const PATIENT_NAV = [
  { href: "/portal/citas", label: "Mis citas" },
  { href: "/portal/historial", label: "Mi historial" },
  { href: "/portal/documentos", label: "Mis documentos" },
];

export function AppShell({
  tenantName,
  role,
  children,
}: {
  tenantName: string;
  role: MembershipRole;
  children: React.ReactNode;
}) {
  const nav = role === "patient" ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden w-56 shrink-0 border-r px-4 py-6 sm:block">
        <p className="mb-6 truncate px-2 font-medium">{tenantName}</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <p className="text-sm font-medium sm:hidden">{tenantName}</p>
          <div />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
