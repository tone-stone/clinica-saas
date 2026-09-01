-- Historial clínico: append-only (sin política de UPDATE/DELETE, ver 0005).
-- Las correcciones se registran como una nueva entrada que referencia amends_record_id.
create table public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  staff_id uuid not null references auth.users (id),
  record_type text not null default 'general' check (
    record_type in ('general', 'medicina', 'psicologia')
  ),
  summary text,
  content jsonb not null default '{}'::jsonb,
  visible_to_patient boolean not null default false,
  amends_record_id uuid references public.clinical_records (id),
  created_at timestamptz not null default now()
);

comment on column public.clinical_records.visible_to_patient is 'El profesional decide explícitamente si esta entrada es visible en el portal del paciente. Default false.';

create index clinical_records_tenant_id_idx on public.clinical_records (tenant_id);
create index clinical_records_patient_id_idx on public.clinical_records (patient_id, created_at desc);

-- Adjuntos clínicos (Cloudinary, delivery type "authenticated")
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  clinical_record_id uuid references public.clinical_records (id) on delete cascade,
  cloudinary_public_id text not null,
  resource_type text not null default 'raw' check (resource_type in ('image', 'raw', 'video')),
  original_filename text,
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index attachments_tenant_id_idx on public.attachments (tenant_id);
create index attachments_patient_id_idx on public.attachments (patient_id);
create index attachments_clinical_record_id_idx on public.attachments (clinical_record_id);

-- Bitácora de auditoría (compliance médico-legal). Sin UPDATE/DELETE.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_id_idx on public.audit_logs (tenant_id, created_at desc);
