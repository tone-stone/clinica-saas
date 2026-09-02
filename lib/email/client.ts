import "server-only";
import { Resend } from "resend";

// Instanciación perezosa: ver lib/stripe/client.ts para el porqué.
let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!);
  }
  return resendClient;
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "citas@tuapp.com";
