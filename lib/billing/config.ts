/**
 * La facturación (Stripe) solo se activa si hay clave secreta configurada y no se
 * desactivó explícitamente con BILLING_ENABLED=false.
 *
 * Con la facturación desactivada, el alta de clínicas simula un pago exitoso: el
 * tenant queda en estado "active" sin pasar por Stripe Checkout.
 */
export const BILLING_ENABLED =
  !!process.env.STRIPE_SECRET_KEY && process.env.BILLING_ENABLED !== "false";
