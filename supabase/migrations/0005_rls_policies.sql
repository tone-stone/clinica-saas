-- Funciones auxiliares para las políticas RLS.
-- security definer + search_path fijo: evita recursión de RLS al consultar memberships
-- desde dentro de una policy, y evita hijacking de search_path.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.super_admins sa where sa.user_id = auth.uid()
  );
$$;

create or replace function public.is_member_of(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = target_tenant
  );
$$;

create or replace function public.has_staff_access(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = target_tenant
      and m.role in ('owner', 'staff')
  );
$$;

create or replace function public.is_owner(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = target_tenant and m.role = 'owner'
  );
$$;

create or replace function public.owns_patient(target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = target_patient and p.user_id = auth.uid()
  );
$$;

-- Habilitar RLS en todas las tablas de negocio
alter table public.tenants enable row level security;
alter table public.super_admins enable row level security;
alter table public.memberships enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.clinical_records enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.plans enable row level security;

-- tenants: la creación de tenants se hace exclusivamente desde el server
-- usando la service role key (signup flow), por eso no hay policy de INSERT.
create policy tenants_select on public.tenants
  for select using (public.is_member_of(id) or public.is_super_admin());

create policy tenants_update on public.tenants
  for update using (public.is_owner(id) or public.is_super_admin());

-- super_admins: cada quien puede ver su propio estatus; el resto lo gestiona service role.
create policy super_admins_select on public.super_admins
  for select using (user_id = auth.uid());

-- memberships
create policy memberships_select on public.memberships
  for select using (public.is_member_of(tenant_id) or public.is_super_admin());

create policy memberships_insert on public.memberships
  for insert with check (public.is_owner(tenant_id) or public.is_super_admin());

create policy memberships_update on public.memberships
  for update using (public.is_owner(tenant_id) or public.is_super_admin());

create policy memberships_delete on public.memberships
  for delete using (public.is_owner(tenant_id) or public.is_super_admin());

-- patients
create policy patients_select on public.patients
  for select using (
    public.has_staff_access(tenant_id) or user_id = auth.uid() or public.is_super_admin()
  );

create policy patients_insert on public.patients
  for insert with check (public.has_staff_access(tenant_id) or public.is_super_admin());

create policy patients_update on public.patients
  for update using (public.has_staff_access(tenant_id) or public.is_super_admin());

create policy patients_delete on public.patients
  for delete using (public.has_staff_access(tenant_id) or public.is_super_admin());

-- appointments: staff tiene control total; el paciente puede solicitar (insert propio,
-- status pending) y cancelar su propia cita (update acotado por el WITH CHECK).
create policy appointments_select on public.appointments
  for select using (
    public.has_staff_access(tenant_id)
    or public.owns_patient(patient_id)
    or public.is_super_admin()
  );

create policy appointments_insert on public.appointments
  for insert with check (
    public.has_staff_access(tenant_id)
    or (public.owns_patient(patient_id) and status = 'pending')
    or public.is_super_admin()
  );

create policy appointments_update on public.appointments
  for update using (
    public.has_staff_access(tenant_id)
    or public.owns_patient(patient_id)
    or public.is_super_admin()
  )
  with check (
    public.has_staff_access(tenant_id)
    or (public.owns_patient(patient_id) and status = 'cancelled')
    or public.is_super_admin()
  );

-- Sin policy de DELETE: cancelar es un cambio de estado, no un borrado.

-- clinical_records: solo staff escribe; solo INSERT y SELECT (append-only, sin UPDATE/DELETE).
create policy clinical_records_select on public.clinical_records
  for select using (
    public.has_staff_access(tenant_id)
    or (visible_to_patient and public.owns_patient(patient_id))
    or public.is_super_admin()
  );

create policy clinical_records_insert on public.clinical_records
  for insert with check (public.has_staff_access(tenant_id) or public.is_super_admin());

-- attachments: visibles al paciente solo si están ligados a un clinical_record compartido.
create policy attachments_select on public.attachments
  for select using (
    public.has_staff_access(tenant_id)
    or public.is_super_admin()
    or (
      public.owns_patient(patient_id)
      and clinical_record_id in (
        select id from public.clinical_records where visible_to_patient = true
      )
    )
  );

create policy attachments_insert on public.attachments
  for insert with check (public.has_staff_access(tenant_id) or public.is_super_admin());

create policy attachments_delete on public.attachments
  for delete using (public.has_staff_access(tenant_id) or public.is_super_admin());

-- audit_logs: solo el owner de la clínica (o super_admin) puede leer; inserción abierta
-- a cualquier miembro del tenant (las acciones del propio usuario quedan registradas).
create policy audit_logs_select on public.audit_logs
  for select using (public.is_owner(tenant_id) or public.is_super_admin());

create policy audit_logs_insert on public.audit_logs
  for insert with check (public.is_member_of(tenant_id) or public.is_super_admin());

-- plans: catálogo público (necesario para la página de precios), gestión solo super_admin.
create policy plans_select on public.plans
  for select using (true);

create policy plans_write on public.plans
  for all using (public.is_super_admin()) with check (public.is_super_admin());
