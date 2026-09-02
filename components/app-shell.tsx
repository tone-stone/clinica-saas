"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  Newspaper,
  Pencil,
  Plus,
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

type IconType = typeof LayoutDashboard;

/** "portal" es solo un prefijo de agrupación (portal de pacientes), no una página real. */
const ROUTE_META: Record<string, { icon: IconType; label: string }> = {
  dashboard: { icon: LayoutDashboard, label: "Panel" },
  pacientes: { icon: Users, label: "Pacientes" },
  citas: { icon: Calendar, label: "Citas" },
  equipo: { icon: UserCog, label: "Equipo" },
  reportes: { icon: BarChart3, label: "Reportes" },
  "blog-admin": { icon: Newspaper, label: "Blog" },
  nuevo: { icon: Plus, label: "Nuevo" },
  editar: { icon: Pencil, label: "Editar" },
  historial: { icon: FolderOpen, label: "Historial" },
  documentos: { icon: FolderOpen, label: "Documentos" },
};

interface Crumb {
  href: string;
  icon: IconType;
  label: string | null;
}

/** Segmentos sin match (ids) heredan el ícono del segmento padre, sin texto. */
function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";
  let lastIcon: IconType = LayoutDashboard;

  for (const segment of segments) {
    href += `/${segment}`;
    if (segment === "portal") continue;
    const meta = ROUTE_META[segment];
    if (meta) lastIcon = meta.icon;
    crumbs.push({ href, icon: meta?.icon ?? lastIcon, label: meta?.label ?? null });
  }
  return crumbs;
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const crumbs = buildCrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Ruta actual"
      className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm text-muted-foreground"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex shrink-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />}
            <Link
              href={crumb.href}
              aria-current={isLast ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground",
                isLast && "font-medium text-foreground"
              )}
            >
              <crumb.icon className="size-4 shrink-0" />
              {crumb.label && <span className="hidden lg:inline">{crumb.label}</span>}
            </Link>
          </span>
        );
      })}
    </nav>
  );
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
  const router = useRouter();
  const nav = role === "patient" ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex min-h-svh flex-1 bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground sm:flex print:hidden">
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
        <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-3 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Ir atrás"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Ir adelante"
                onClick={() => router.forward()}
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <Logo />
            </div>
            <Breadcrumbs pathname={pathname} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {ROLE_LABEL[role]}
            </Badge>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
