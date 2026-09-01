import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "incomplete";
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      if (tenantId && session.subscription) {
        await admin
          .from("tenants")
          .update({ stripe_subscription_id: String(session.subscription) })
          .eq("id", tenantId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenant_id;
      if (tenantId) {
        const periodEnd = subscription.items.data[0]?.current_period_end;
        await admin
          .from("tenants")
          .update({
            subscription_status: mapStripeStatus(subscription.status),
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq("id", tenantId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenant_id;
      if (tenantId) {
        await admin.from("tenants").update({ subscription_status: "canceled" }).eq("id", tenantId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
