"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { BILLING_ENABLED } from "@/lib/billing/config";
import { subdomainSchema } from "@/lib/validation/subdomain";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PROTOCOL = ROOT_DOMAIN.startsWith("localhost") ? "http" : "https";

const signupSchema = z.object({
  clinicName: z.string().min(2, "Ingresa el nombre de tu clínica"),
  subdomain: subdomainSchema,
  ownerFullName: z.string().min(2, "Ingresa tu nombre"),
  ownerEmail: z.string().email("Correo inválido"),
  ownerPassword: z.string().min(8, "Mínimo 8 caracteres"),
  planId: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().uuid("Selecciona un plan").optional()
  ),
});

export interface SignupState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function signupTenant(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    clinicName: formData.get("clinicName"),
    subdomain: formData.get("subdomain"),
    ownerFullName: formData.get("ownerFullName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
    planId: formData.get("planId"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Revisa los datos del formulario", fieldErrors };
  }

  const { clinicName, subdomain, ownerFullName, ownerEmail, ownerPassword, planId } = parsed.data;
  const admin = createAdminClient();

  const { data: existingTenant } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();
  if (existingTenant) {
    return { error: "Ese subdominio ya está en uso", fieldErrors: { subdomain: "Ya está en uso" } };
  }

  let plan: { id: string; stripe_price_id: string } | null = null;
  if (planId) {
    const { data } = await admin.from("plans").select("*").eq("id", planId).maybeSingle();
    if (!data) {
      return { error: "El plan seleccionado no existe" };
    }
    plan = data;
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { full_name: ownerFullName },
  });
  if (createUserError || !createdUser.user) {
    return { error: createUserError?.message ?? "No se pudo crear el usuario" };
  }
  const ownerId = createdUser.user.id;

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: clinicName,
      subdomain,
      plan_id: plan?.id ?? null,
      subscription_status: plan && BILLING_ENABLED ? "incomplete" : "active",
    })
    .select()
    .single();
  if (tenantError || !tenant) {
    await admin.auth.admin.deleteUser(ownerId);
    return { error: tenantError?.message ?? "No se pudo crear la clínica" };
  }

  const { error: membershipError } = await admin
    .from("memberships")
    .insert({ tenant_id: tenant.id, user_id: ownerId, role: "owner" });
  if (membershipError) {
    await admin.auth.admin.deleteUser(ownerId);
    await admin.from("tenants").delete().eq("id", tenant.id);
    return { error: membershipError.message };
  }

  const tenantOrigin = `${PROTOCOL}://${subdomain}.${ROOT_DOMAIN}`;

  // Inicia sesión en el navegador (server action: sí puede escribir cookies).
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword });

  // Sin plan, o con la facturación desactivada (modo simulación): la clínica
  // queda activa sin pasar por Stripe Checkout.
  if (!plan || !BILLING_ENABLED) {
    redirect(`${tenantOrigin}/dashboard`);
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: ownerEmail,
    name: clinicName,
    metadata: { tenant_id: tenant.id },
  });
  await admin.from("tenants").update({ stripe_customer_id: customer.id }).eq("id", tenant.id);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${tenantOrigin}/dashboard?checkout=success`,
    cancel_url: `${PROTOCOL}://${ROOT_DOMAIN}/precios?checkout=cancelado`,
    metadata: { tenant_id: tenant.id },
    subscription_data: { metadata: { tenant_id: tenant.id } },
  });

  redirect(checkoutSession.url ?? `${tenantOrigin}/dashboard`);
}
