-- Marcas para los avisos automáticos "está por comenzar" y "ya terminó",
-- basados en scheduled_at/duration_minutes (no en un cambio de status manual).
-- Mismo patrón que reminder_sent_at (0009): NULL = aún no se ha enviado.
alter table public.appointments
  add column started_notified_at timestamptz,
  add column finished_notified_at timestamptz;
