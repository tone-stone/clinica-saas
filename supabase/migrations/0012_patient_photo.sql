-- Foto de perfil del paciente (opcional). Mismo esquema "authenticated" que los
-- adjuntos clínicos: nunca pública, se sirve con URL firmada.
alter table public.patients
  add column photo_public_id text;
