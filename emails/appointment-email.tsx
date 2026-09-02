import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type AppointmentEmailEvent = "created" | "confirmed" | "cancelled" | "reminder";

const COPY: Record<AppointmentEmailEvent, { subject: string; heading: string; intro: string }> = {
  created: {
    subject: "Recibimos tu solicitud de cita",
    heading: "Tu cita fue solicitada",
    intro: "Quedó registrada como pendiente. Te avisaremos en cuanto quede confirmada.",
  },
  confirmed: {
    subject: "Tu cita fue confirmada",
    heading: "Tu cita está confirmada",
    intro: "Este es un recordatorio con los datos de tu cita confirmada.",
  },
  cancelled: {
    subject: "Tu cita fue cancelada",
    heading: "Tu cita fue cancelada",
    intro: "La siguiente cita ya no está vigente. Si fue un error, contáctanos para reagendar.",
  },
  reminder: {
    subject: "Recordatorio: tienes una cita mañana",
    heading: "Recordatorio de tu cita",
    intro: "Tu cita es mañana. Aquí están los detalles.",
  },
};

export function appointmentEmailSubject(event: AppointmentEmailEvent) {
  return COPY[event].subject;
}

export function AppointmentEmail({
  event,
  clinicName,
  patientName,
  staffName,
  scheduledAtLabel,
  durationMinutes,
  reason,
}: {
  event: AppointmentEmailEvent;
  clinicName: string;
  patientName: string;
  staffName: string;
  scheduledAtLabel: string;
  durationMinutes: number;
  reason: string | null;
}) {
  const copy = COPY[event];

  return (
    <Html lang="es">
      <Head />
      <Preview>{copy.subject}</Preview>
      <Body style={{ backgroundColor: "#f7f9fa", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "12px",
            maxWidth: "480px",
            border: "1px solid #dee6ea",
          }}
        >
          <Text style={{ fontSize: "13px", color: "#5b6b76", margin: "0 0 16px" }}>
            {clinicName}
          </Text>
          <Heading style={{ fontSize: "20px", color: "#1a2733", margin: "0 0 12px" }}>
            {copy.heading}
          </Heading>
          <Text style={{ fontSize: "14px", color: "#1a2733", margin: "0 0 20px" }}>
            Hola {patientName}, {copy.intro}
          </Text>

          <Section
            style={{
              backgroundColor: "#f7f9fa",
              borderRadius: "8px",
              padding: "16px 20px",
            }}
          >
            <Text style={{ fontSize: "14px", margin: "0 0 4px", color: "#1a2733" }}>
              <strong>Fecha y hora:</strong> {scheduledAtLabel}
            </Text>
            <Text style={{ fontSize: "14px", margin: "0 0 4px", color: "#1a2733" }}>
              <strong>Duración:</strong> {durationMinutes} min
            </Text>
            <Text style={{ fontSize: "14px", margin: "0 0 4px", color: "#1a2733" }}>
              <strong>Profesional:</strong> {staffName}
            </Text>
            {reason && (
              <Text style={{ fontSize: "14px", margin: "0", color: "#1a2733" }}>
                <strong>Motivo:</strong> {reason}
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: "#dee6ea", margin: "24px 0" }} />
          <Text style={{ fontSize: "12px", color: "#5b6b76", margin: 0 }}>
            Este es un mensaje automático de {clinicName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
