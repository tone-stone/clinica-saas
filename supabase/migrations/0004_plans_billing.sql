-- Planes de suscripción (el MVP lanza con un único plan anual, pero el modelo soporta tiers).
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_price_id text not null unique,
  interval text not null default 'year' check (interval in ('year', 'month')),
  price_cents integer not null,
  currency text not null default 'usd',
  max_staff integer,
  max_patients integer,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Columnas de facturación en tenants
alter table public.tenants
  add column plan_id uuid references public.plans (id),
  add column subscription_status text not null default 'trialing' check (
    subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')
  ),
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column trial_ends_at timestamptz,
  add column current_period_end timestamptz;

comment on column public.tenants.subscription_status is 'Sincronizado desde los webhooks de Stripe. El middleware bloquea la app si no es trialing/active.';
