import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAppointmentEvent } from "@/lib/notifications/appointment-notifications";

/**
 * Recordatorio 24h antes. Vercel Cron llama esta ruta cada hora (ver
 * vercel.json) con `Authorization: Bearer $CRON_SECRET`. Ventana de 2h
 * (23-25h adelante) para tolerar que alguna corrida falle sin perder el
 * recordatorio; reminder_sent_at evita reenviarlo si ya se mandó.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const windowStart = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await admin
    .from("appointments")
    .select("id, tenant_id, patient_id, staff_id, scheduled_at, duration_minutes, reason")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", windowStart)
    .lt("scheduled_at", windowEnd);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const appt of appointments ?? []) {
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
      event: "reminder",
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
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", appt.id);
    sent++;
  }

  return NextResponse.json({ checked: appointments?.length ?? 0, sent });
}
