-- Blog por clínica. Tabla creada ahora para no romper el modelo de datos más adelante;
-- la interfaz de administración del blog es trabajo de fase 2 (ver plan).
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  author_id uuid references auth.users (id),
  title text not null,
  slug text not null,
  content text,
  cover_image_public_id text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index blog_posts_tenant_id_idx on public.blog_posts (tenant_id);

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

create policy blog_posts_select on public.blog_posts
  for select using (
    status = 'published' or public.has_staff_access(tenant_id) or public.is_super_admin()
  );

create policy blog_posts_write on public.blog_posts
  for all using (public.has_staff_access(tenant_id) or public.is_super_admin())
  with check (public.has_staff_access(tenant_id) or public.is_super_admin());
