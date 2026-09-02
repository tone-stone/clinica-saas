import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

export interface AppointmentRef {
  scheduledAt: string;
  status: AppointmentStatus;
}

export interface PatientSummary {
  nextAppointment: AppointmentRef | null;
  lastAppointment: AppointmentRef | null;
  condition: string | null;
  /** Profesional de la cita más próxima/reciente: quién lleva el caso hoy. */
  assignedStaffId: string | null;
  /** Citas con status "completed": sesiones realmente atendidas. */
  completedSessions: number;
}

/**
 * Resumen por paciente (próxima/última cita, padecimiento más reciente,
 * profesional a cargo y sesiones completadas) para la lista de pacientes.
 * Dos consultas en bloque en vez de N+1 por paciente.
 */
export async function getPatientSummaries(
  tenantId: string,
  patientIds: string[]
): Promise<Record<string, PatientSummary>> {
  const summaries: Record<string, PatientSummary> = {};
  if (patientIds.length === 0) return summaries;

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: appointments }, { data: records }] = await Promise.all([
    supabase
      .from("appointments")
      .select("patient_id, staff_id, scheduled_at, status")
      .eq("tenant_id", tenantId)
      .in("patient_id", patientIds)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("clinical_records")
      .select("patient_id, summary, created_at")
      .eq("tenant_id", tenantId)
      .in("patient_id", patientIds)
      .not("summary", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  for (const patientId of patientIds) {
    const patientAppointments = (appointments ?? []).filter((a) => a.patient_id === patientId);
    const upcoming = patientAppointments.find(
      (a) => a.scheduled_at >= nowIso && a.status !== "cancelled"
    );
    const past = [...patientAppointments].reverse().find((a) => a.scheduled_at < nowIso);
    const latestRecord = (records ?? []).find((r) => r.patient_id === patientId);

    summaries[patientId] = {
      nextAppointment: upcoming
        ? { scheduledAt: upcoming.scheduled_at, status: upcoming.status }
        : null,
      lastAppointment: past ? { scheduledAt: past.scheduled_at, status: past.status } : null,
      condition: latestRecord?.summary ?? null,
      assignedStaffId: (upcoming ?? past)?.staff_id ?? null,
      completedSessions: patientAppointments.filter((a) => a.status === "completed").length,
    };
  }
  return summaries;
}
