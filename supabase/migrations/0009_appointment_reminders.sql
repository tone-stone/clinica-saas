-- Marca de recordatorio (email/WhatsApp 24h antes) para no reenviarlo en
-- cada corrida del cron. NULL = aún no se ha enviado.
alter table public.appointments
  add column reminder_sent_at timestamptz;
