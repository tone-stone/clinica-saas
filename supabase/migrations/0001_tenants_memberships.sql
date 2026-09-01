-- Extensiones necesarias
create extension if not exists pgcrypto;

-- Utilidad genérica para mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Clínicas/consultorios (tenants). Las columnas de facturación se agregan en 0004.
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  custom_domain text unique,
  created_at timestamptz not null default now()
);

comment on table public.tenants is 'Una fila por clínica/consultorio. subdomain resuelve <subdomain>.NEXT_PUBLIC_ROOT_DOMAIN al tenant.';

-- Dueños del SaaS (staff de la plataforma, no de una clínica en particular)
create table public.super_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Membresías: qué usuario pertenece a qué tenant y con qué rol.
-- Diseño many-to-many: permite que un profesional o paciente pertenezca a más de una clínica.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff', 'patient')),
  staff_role text check (staff_role in ('doctor', 'psicologo', 'recepcion')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint staff_role_only_for_staff check (
    (role = 'staff' and staff_role is not null) or
    (role <> 'staff' and staff_role is null)
  )
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_tenant_id_idx on public.memberships (tenant_id);
