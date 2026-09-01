"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe/client";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PROTOCOL = ROOT_DOMAIN.startsWith("localhost") ? "http" : "https";

export async function openBillingPortal() {
  const headerList = await headers();
  const subdomain = headerList.get("x-tenant-subdomain");
  if (!subdomain) throw new Error("No se pudo determinar la clínica");

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || !tenant.stripe_customer_id) throw new Error("La clínica no tiene facturación configurada");

  const membership = await getCurrentMembership(tenant.id);
  if (!membership || membership.role !== "owner") {
    throw new Error("Solo el dueño de la clínica puede gestionar la suscripción");
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${PROTOCOL}://${subdomain}.${ROOT_DOMAIN}/dashboard`,
  });

  redirect(portalSession.url);
}
