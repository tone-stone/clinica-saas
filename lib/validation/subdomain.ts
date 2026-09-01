import { z } from "zod";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "blog",
  "docs",
  "status",
  "help",
  "static",
  "cdn",
]);

export const subdomainSchema = z
  .string()
  .min(3, "Mínimo 3 caracteres")
  .max(40, "Máximo 40 caracteres")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (sin empezar/terminar en guion)")
  .refine((value) => !RESERVED_SUBDOMAINS.has(value), "Ese subdominio está reservado");

export function slugifySubdomain(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos/diacríticos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
