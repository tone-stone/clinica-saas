-- Plan anual por defecto. Reemplazar stripe_price_id por el Price ID real de Stripe
-- (modo test primero) antes de probar el flujo de checkout.
insert into public.plans (name, stripe_price_id, interval, price_cents, currency, max_staff, max_patients)
values ('Plan Anual', 'price_REEMPLAZAR', 'year', 29900 * 12, 'usd', null, null)
on conflict (stripe_price_id) do nothing;

-- ---------------------------------------------------------------------------
-- Datos de prueba para verificar aislamiento entre tenants (RLS). Descomentar
-- y reemplazar los UUID de auth.users por usuarios reales creados en Supabase
-- Auth (Dashboard > Authentication > Users) antes de ejecutar en un entorno
-- de desarrollo. NO ejecutar en producción.
-- ---------------------------------------------------------------------------

-- insert into public.tenants (id, name, subdomain) values
--   ('11111111-1111-1111-1111-111111111111', 'Clínica A (demo)', 'clinica-a'),
--   ('22222222-2222-2222-2222-222222222222', 'Clínica B (demo)', 'clinica-b');
--
-- insert into public.memberships (tenant_id, user_id, role) values
--   ('11111111-1111-1111-1111-111111111111', '<uuid-usuario-owner-a>', 'owner'),
--   ('22222222-2222-2222-2222-222222222222', '<uuid-usuario-owner-b>', 'owner');
