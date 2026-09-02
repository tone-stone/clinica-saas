-- Amplía el catálogo de planes a Semestral + Anual.
-- El campo `interval` solo alimenta la etiqueta de la página de precios; el período
-- real de cobro lo define el Price de Stripe (interval_count 6 = semestral).

alter table public.plans drop constraint if exists plans_interval_check;
alter table public.plans
  add constraint plans_interval_check check (interval in ('year', 'month', 'semiannual'));

-- Retira el plan anual placeholder del seed original (0004).
update public.plans set is_active = false where stripe_price_id = 'price_REEMPLAZAR';

-- REEMPLAZAR los stripe_price_id por los Price ID reales de Stripe (modo test primero).
insert into public.plans (name, stripe_price_id, interval, price_cents, currency, max_staff, max_patients)
values
  ('Plan Semestral', 'price_semestral_REEMPLAZAR', 'semiannual', 161400, 'usd', null, null),
  ('Plan Anual',     'price_anual_REEMPLAZAR',     'year',       286900, 'usd', null, null)
on conflict (stripe_price_id) do update set
  name        = excluded.name,
  interval    = excluded.interval,
  price_cents = excluded.price_cents,
  currency    = excluded.currency,
  is_active   = true;
