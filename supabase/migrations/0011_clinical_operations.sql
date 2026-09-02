-- Escalas clínicas estandarizadas (PHQ-9, GAD-7) con seguimiento de puntaje.
-- Solo staff: es evaluación clínica, no autorreporte libre del paciente.
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  staff_id uuid not null references auth.users (id),
  appointment_id uuid references public.appointments (id) on delete set null,
  scale_type text not null check (scale_type in ('phq9', 'gad7')),
  answers jsonb not null default '[]'::jsonb,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index assessments_patient_idx on public.assessments (tenant_id, patient_id, created_at desc);

-- Pre-consulta: el propio paciente la llena antes de su cita, para que el
-- profesional llegue con contexto. Único write del paciente sobre su propia cita.
create table public.appointment_intake (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  motivo text,
  sintomas text,
  severidad text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id)
);

create trigger appointment_intake_set_updated_at
  before update on public.appointment_intake
  for each row execute function public.set_updated_at();

-- Consentimiento informado: el staff redacta, el paciente "firma" (nombre
-- tecleado + timestamp). No es firma digital con validez legal plena, es un
-- registro tipo clickwrap — suficiente para consentimiento informado básico.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  title text not null,
  body text not null,
  signed_name text,
  signed_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index consents_patient_idx on public.consents (tenant_id, patient_id, created_at desc);

-- Lista de espera: el paciente se apunta, el staff la revisa manualmente al
-- cancelarse una cita (sin oferta/reclamo automático en esta fase).
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  staff_id uuid references auth.users (id),
  note text,
  status text not null default 'waiting' check (status in ('waiting', 'resolved', 'cancelled')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index waitlist_entries_tenant_idx on public.waitlist_entries (tenant_id, status, created_at);

-- Cobro por sesión: precio de la cita y si ya se cobró (registro manual del
-- staff — efectivo/transferencia/etc., no procesa el pago en línea).
alter table public.appointments
  add column price_cents integer check (price_cents is null or price_cents >= 0),
  add column payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'waived'));

alter table public.assessments enable row level security;
alter table public.appointment_intake enable row level security;
alter table public.consents enable row level security;
alter table public.waitlist_entries enable row level security;

-- assessments: solo staff (crear y ver).
create policy assessments_select on public.assessments
  for select using (public.has_staff_access(tenant_id) or public.is_super_admin());

create policy assessments_insert on public.assessments
  for insert with check (public.has_staff_access(tenant_id) or public.is_super_admin());

-- appointment_intake: staff ve todo; el paciente crea/edita solo la de su propia cita.
create policy appointment_intake_select on public.appointment_intake
  for select using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

create policy appointment_intake_insert on public.appointment_intake
  for insert with check (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

create policy appointment_intake_update on public.appointment_intake
  for update using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

-- consents: staff crea y ve todo; el paciente ve las suyas y solo puede
-- "firmarlas" (mover a signed_at no nulo), nunca redactar el contenido.
create policy consents_select on public.consents
  for select using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

create policy consents_insert on public.consents
  for insert with check (public.has_staff_access(tenant_id) or public.is_super_admin());

create policy consents_update on public.consents
  for update using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  )
  with check (
    public.has_staff_access(tenant_id)
    or (public.owns_patient(patient_id) and signed_at is not null)
    or public.is_super_admin()
  );

-- waitlist_entries: staff control total; el paciente crea/ve/cancela la suya.
create policy waitlist_select on public.waitlist_entries
  for select using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

create policy waitlist_insert on public.waitlist_entries
  for insert with check (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );

create policy waitlist_update on public.waitlist_entries
  for update using (
    public.has_staff_access(tenant_id) or public.owns_patient(patient_id) or public.is_super_admin()
  );
