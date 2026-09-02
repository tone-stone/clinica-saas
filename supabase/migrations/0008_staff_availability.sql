-- Horario de atención configurable por profesional: qué días y en qué rango de
-- horas atiende, usado por el selector de citas para calcular horarios disponibles.
create table public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  -- Minutos desde medianoche. Ambos null = cerrado ese día.
  start_minutes integer,
  end_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_availability_range_check check (
    (start_minutes is null and end_minutes is null)
    or (start_minutes is not null and end_minutes is not null and end_minutes > start_minutes)
  ),
  unique (tenant_id, staff_id, day_of_week)
);

create index staff_availability_staff_idx on public.staff_availability (tenant_id, staff_id);

alter table public.staff_availability enable row level security;

-- Cualquier miembro del tenant (incluidos pacientes) necesita leer esto para
-- calcular horarios disponibles al agendar.
create policy staff_availability_select on public.staff_availability
  for select using (public.is_member_of(tenant_id) or public.is_super_admin());

-- Cada profesional edita su propio horario; el owner puede editar el de cualquiera.
create policy staff_availability_write on public.staff_availability
  for all using (
    public.is_owner(tenant_id) or staff_id = auth.uid() or public.is_super_admin()
  )
  with check (
    public.is_owner(tenant_id) or staff_id = auth.uid() or public.is_super_admin()
  );
