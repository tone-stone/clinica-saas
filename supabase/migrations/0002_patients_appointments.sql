-- Pacientes de cada clínica
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

comment on column public.patients.user_id is 'NULL hasta que el paciente acepta la invitación al portal; luego enlaza con auth.users.';

create index patients_tenant_id_idx on public.patients (tenant_id);
create unique index patients_user_id_idx on public.patients (user_id) where user_id is not null;

-- Citas
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  staff_id uuid not null references auth.users (id),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')
  ),
  reason text,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_tenant_id_idx on public.appointments (tenant_id);
create index appointments_patient_id_idx on public.appointments (patient_id);
create index appointments_staff_id_scheduled_at_idx on public.appointments (staff_id, scheduled_at);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();
