import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAppointmentEvent } from "@/lib/notifications/appointment-notifications";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { AppointmentEmailEvent } from "@/emails/appointment-email";

type AppointmentCandidate = {
  id: string;
  tenant_id: string;
  patient_id: string;
  staff_id: string;
  scheduled_at: string;
  duration_minutes: number;
  reason: string | null;
};

/** Notifica una tanda de citas y marca el campo correspondiente para no repetir el aviso. */
async function notifyBatch(
  admin: SupabaseClient<Database>,
  event: AppointmentEmailEvent,
  markField: "reminder_sent_at" | "started_notified_at" | "finished_notified_at",
  appointments: AppointmentCandidate[]
) {
  let sent = 0;
  for (const appt of appointments) {
    const [{ data: tenant }, { data: patient }, { data: staffProfile }] = await Promise.all([
      admin.from("tenants").select("name").eq("id", appt.tenant_id).maybeSingle(),
      admin
        .from("patients")
        .select("full_name, email, phone")
        .eq("id", appt.patient_id)
        .maybeSingle(),
      admin.from("profiles").select("full_name, email").eq("id", appt.staff_id).maybeSingle(),
    ]);
    if (!tenant || !patient) continue;

    await notifyAppointmentEvent({
      event,
      clinicName: tenant.name,
      patientName: patient.full_name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      staffName: staffProfile?.full_name ?? staffProfile?.email ?? "tu profesional",
      scheduledAt: appt.scheduled_at,
      durationMinutes: appt.duration_minutes,
      reason: appt.reason,
    });

    await admin
      .from("appointments")
      .update({ [markField]: new Date().toISOString() } as Database["public"]["Tables"]["appointments"]["Update"])
      .eq("id", appt.id);
    sent++;
  }
  return sent;
}

const SELECT_FIELDS = "id, tenant_id, patient_id, staff_id, scheduled_at, duration_minutes, reason";

/**
 * Corre cada 5 minutos (ver vercel.json) con `Authorization: Bearer $CRON_SECRET`
 * y cubre los 3 avisos automáticos basados en tiempo (no en cambio manual de status):
 *  - recordatorio 24h antes
 *  - "está comenzando" cuando llega scheduled_at
 *  - "acaba de terminar" cuando pasa scheduled_at + duration_minutes
 * Cada uno usa su propia columna *_at para no reenviarse en la siguiente corrida.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();

  // 1. Recordatorio 24h antes (ventana de 2h para tolerar una corrida perdida).
  const { data: reminderCandidates, error: reminderError } = await admin
    .from("appointments")
    .select(SELECT_FIELDS)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", iso(now + 23 * 60 * 60 * 1000))
    .lt("scheduled_at", iso(now + 25 * 60 * 60 * 1000));
  if (reminderError) return NextResponse.json({ error: reminderError.message }, { status: 500 });

  // 2. "Está comenzando": scheduled_at ya llegó, en los últimos 10 minutos.
  const { data: startingCandidates, error: startingError } = await admin
    .from("appointments")
    .select(SELECT_FIELDS)
    .eq("status", "confirmed")
    .is("started_notified_at", null)
    .gt("scheduled_at", iso(now - 10 * 60 * 1000))
    .lte("scheduled_at", iso(now));
  if (startingError) return NextResponse.json({ error: startingError.message }, { status: 500 });

  // 3. "Acaba de terminar": scheduled_at + duration_minutes ya pasó. Se trae un
  // rango amplio de candidatas (últimas 4h) y se calcula el fin real en JS,
  // porque duration_minutes varía por cita y PostgREST no filtra por columnas
  // calculadas.
  const { data: endingSoonCandidates, error: endingError } = await admin
    .from("appointments")
    .select(SELECT_FIELDS)
    .eq("status", "confirmed")
    .is("finished_notified_at", null)
    .gte("scheduled_at", iso(now - 4 * 60 * 60 * 1000))
    .lte("scheduled_at", iso(now));
  if (endingError) return NextResponse.json({ error: endingError.message }, { status: 500 });

  const finishedCandidates = (endingSoonCandidates ?? []).filter((appt) => {
    const endsAt = new Date(appt.scheduled_at).getTime() + appt.duration_minutes * 60 * 1000;
    return endsAt <= now && endsAt > now - 10 * 60 * 1000;
  });

  const [reminderSent, startingSent, finishedSent] = await Promise.all([
    notifyBatch(admin, "reminder", "reminder_sent_at", reminderCandidates ?? []),
    notifyBatch(admin, "starting", "started_notified_at", startingCandidates ?? []),
    notifyBatch(admin, "finished", "finished_notified_at", finishedCandidates),
  ]);

  return NextResponse.json({
    reminder: { checked: reminderCandidates?.length ?? 0, sent: reminderSent },
    starting: { checked: startingCandidates?.length ?? 0, sent: startingSent },
    finished: { checked: finishedCandidates.length, sent: finishedSent },
  });
}
