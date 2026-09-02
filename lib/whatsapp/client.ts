import "server-only";
import twilio from "twilio";

// Instanciación perezosa: ver lib/stripe/client.ts para el porqué.
let twilioClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  }
  return twilioClient;
}

/** Remitente de WhatsApp configurado en Twilio, ej. "whatsapp:+14155238886" (sandbox). */
export const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? "";

/**
 * Normaliza un teléfono capturado a mano al formato E.164 que exige Twilio.
 * Asume México (+52) si no trae código de país. No valida exhaustivamente:
 * si el número es inválido, Twilio devuelve un error que solo se registra
 * en consola (ver lib/notifications), sin romper el flujo principal.
 */
export function toWhatsAppAddress(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const e164 = digits.startsWith("+") ? digits : `+52${digits}`;
  return `whatsapp:${e164}`;
}
