import "server-only";
import { render } from "@react-email/render";
import { getResend, EMAIL_FROM } from "@/lib/email/client";
import { getTwilioClient, WHATSAPP_FROM, toWhatsAppAddress } from "@/lib/whatsapp/client";
import {
  AppointmentEmail,
  appointmentEmailSubject,
  type AppointmentEmailEvent,
} from "@/emails/appointment-email";

export interface AppointmentNotificationInput {
  event: AppointmentEmailEvent;
  clinicName: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  staffName: string;
  /** ISO timestamp de la cita. */
  scheduledAt: string;
  durationMinutes: number;
  reason: string | null;
}

const WHATSAPP_INTRO: Record<AppointmentEmailEvent, string> = {
  created: "📅 Recibimos tu solicitud de cita en",
  confirmed: "✅ Tu cita en",
  cancelled: "❌ Tu cita en",
  reminder: "⏰ Recordatorio: tienes una cita mañana en",
};

const WHATSAPP_OUTRO: Record<AppointmentEmailEvent, string> = {
  created: "quedó como *pendiente*. Te avisaremos cuando se confirme.",
  confirmed: "quedó *confirmada*.",
  cancelled: "fue *cancelada*.",
  reminder: "está *confirmada* para mañana.",
};

function scheduledAtLabel(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildWhatsAppText(input: AppointmentNotificationInput) {
  const dateLabel = scheduledAtLabel(input.scheduledAt);
  const lines = [
    `${WHATSAPP_INTRO[input.event]} ${input.clinicName} ${WHATSAPP_OUTRO[input.event]}`,
    "",
    `🗓️ ${dateLabel}`,
    `👤 ${input.staffName}`,
  ];
  if (input.reason) lines.push(`📝 ${input.reason}`);
  return lines.join("\n");
}

async function sendEmail(input: AppointmentNotificationInput) {
  if (!input.patientEmail) return;
  if (!process.env.RESEND_API_KEY) {
    console.warn("[notifications] RESEND_API_KEY no configurado; se omite el correo.");
    return;
  }
  try {
    const html = await render(
      AppointmentEmail({
        event: input.event,
        clinicName: input.clinicName,
        patientName: input.patientName,
        staffName: input.staffName,
        scheduledAtLabel: scheduledAtLabel(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        reason: input.reason,
      })
    );
    await getResend().emails.send({
      from: EMAIL_FROM,
      to: input.patientEmail,
      subject: appointmentEmailSubject(input.event),
      html,
    });
  } catch (error) {
    console.error("[notifications] Falló el envío de correo:", error);
  }
}

async function sendWhatsApp(input: AppointmentNotificationInput) {
  if (!input.patientPhone) return;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !WHATSAPP_FROM) {
    console.warn("[notifications] Twilio no configurado; se omite el WhatsApp.");
    return;
  }
  const to = toWhatsAppAddress(input.patientPhone);
  if (!to) return;

  try {
    await getTwilioClient().messages.create({
      from: WHATSAPP_FROM,
      to,
      body: buildWhatsAppText(input),
    });
  } catch (error) {
    console.error("[notifications] Falló el envío de WhatsApp:", error);
  }
}

/**
 * Envía la notificación de cita por correo y WhatsApp en paralelo. Nunca
 * lanza: un canal (o ambos) puede fallar sin interrumpir la acción que
 * agenda/confirma/cancela la cita — solo se registra en consola.
 */
export async function notifyAppointmentEvent(input: AppointmentNotificationInput) {
  await Promise.all([sendEmail(input), sendWhatsApp(input)]);
}
