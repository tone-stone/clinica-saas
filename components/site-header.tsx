import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "sidebar";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-base font-semibold tracking-tight",
        variant === "default" ? "text-foreground" : "text-sidebar-foreground",
        className
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          variant === "default"
            ? "bg-primary text-primary-foreground"
            : "bg-sidebar-primary text-sidebar-primary-foreground"
        )}
      >
        <BrainCircuit className="size-4.5" />
      </span>
      Clínica
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/precios", label: "Precios" },
  { href: "/login", label: "Iniciar sesión" },
];

export function SiteHeader() {
  return (
    <header className="border-b bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Button size="sm" className="ml-2" render={<Link href="/registro">Crear mi clínica</Link>} />
        </nav>
      </div>
    </header>
  );
}
