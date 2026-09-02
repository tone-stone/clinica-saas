"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  FolderOpen,
  LayoutDashboard,
  Newspaper,
  Users,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/site-header";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { MembershipRole } from "@/lib/supabase/database.types";

const STAFF_NAV = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/citas", label: "Citas", icon: Calendar },
  { href: "/equipo", label: "Equipo", icon: UserCog },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/blog-admin", label: "Blog", icon: Newspaper },
];

const PATIENT_NAV = [
  { href: "/portal/citas", label: "Mis citas", icon: Calendar },
  { href: "/portal/historial", label: "Mi historial", icon: FolderOpen },
  { href: "/portal/documentos", label: "Mis documentos", icon: FolderOpen },
];

const ROLE_LABEL: Record<MembershipRole, string> = {
  owner: "Propietario",
  staff: "Equipo",
  patient: "Paciente",
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  tenantName,
  role,
  children,
}: {
  tenantName: string;
  role: MembershipRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = role === "patient" ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex min-h-svh flex-1 bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground sm:flex">
        <div className="px-2">
          <Logo variant="sidebar" />
          <p className="mt-4 truncate text-sm font-medium text-sidebar-foreground/90">
            {tenantName}
          </p>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-0.5">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3">
          <div className="flex items-center gap-2 sm:hidden">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
          </div>
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
