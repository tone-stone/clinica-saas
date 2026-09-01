-- Espejo mínimo de auth.users para poder mostrar nombres (auth.users no es
-- consultable vía la API de PostgREST). Se llena automáticamente con un trigger.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Solo visible para uno mismo o para quienes comparten al menos un tenant
-- (evita filtrar correos/nombres de otras clínicas entre sí).
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships mine
      join public.memberships theirs on theirs.tenant_id = mine.tenant_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
    or public.is_super_admin()
  );

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
