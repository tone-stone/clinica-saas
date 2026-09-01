import "server-only";
import Stripe from "stripe";

// Instanciación perezosa: si se creara al importar el módulo, Next.js
// fallaría al recolectar datos de página en build si STRIPE_SECRET_KEY
// todavía no está configurada (pasa incluso en rutas que ni siquiera cobran).
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-08-26.dahlia",
    });
  }
  return stripeClient;
}
