-- Ledga Row Level Security: current applied state (June 2026)
-- Safe to re-run. Reflects what is live in production.
--
-- Security model:
--   * Every table: RLS enabled, owners (authenticated) manage only their rows.
--   * NO anonymous table access at all.
--   * Public pages (payment links /pay/:token, client portal /portal/:token)
--     go through SECURITY DEFINER functions keyed by unguessable uuid tokens:
--       get_invoice_for_payment(p_token uuid)
--       get_portal_data(p_token uuid)
--   * Writes that money depends on (invoice paid, plan active) happen only in
--     edge functions (verify-payment, verify-subscription) via service role
--     after confirming the transaction with Paystack.

alter table public.profiles  enable row level security;
alter table public.invoices  enable row level security;
alter table public.clients   enable row level security;

-- Owner-only policies
drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "invoices_owner_all" on public.invoices;
create policy "invoices_owner_all" on public.invoices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "clients_owner_all" on public.clients;
create policy "clients_owner_all" on public.clients
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No anonymous access: these must NOT exist. Dropping is idempotent.
drop policy if exists "profiles_anon_read" on public.profiles;
drop policy if exists "invoices_anon_read" on public.invoices;
drop policy if exists "clients_anon_read"  on public.clients;

-- Unguessable public tokens for shareable links
alter table public.invoices add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists invoices_public_token_idx on public.invoices(public_token);
alter table public.clients add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists clients_public_token_idx on public.clients(public_token);

-- Server-side bookkeeping columns
alter table public.invoices add column if not exists paid_at timestamptz;
alter table public.profiles add column if not exists plan_activated_at timestamptz,
                            add column if not exists plan_paystack_ref text;

-- Token-gated lookup for the payment page
create or replace function public.get_invoice_for_payment(p_token uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'invoice', json_build_object(
      'id', i.id, 'invoice_number', i.invoice_number, 'status', i.status,
      'items', i.items, 'subtotal', i.subtotal, 'tax', i.tax, 'total', i.total,
      'notes', i.notes, 'due_date', i.due_date, 'public_token', i.public_token),
    'client', json_build_object('name', c.name, 'email', c.email),
    'business', json_build_object(
      'business_name', p.business_name, 'owner_name', p.owner_name,
      'currency', p.currency))
  from invoices i
  left join clients c on c.id = i.client_id
  left join profiles p on p.id = i.user_id
  where i.public_token = p_token
$$;
revoke all on function public.get_invoice_for_payment(uuid) from public;
grant execute on function public.get_invoice_for_payment(uuid) to anon, authenticated;

-- Token-gated lookup for the client portal
create or replace function public.get_portal_data(p_token uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'client', json_build_object('name', c.name, 'email', c.email),
    'business_name', p.business_name,
    'invoices', coalesce((
      select json_agg(json_build_object(
        'id', i.id, 'invoice_number', i.invoice_number, 'status', i.status,
        'items', i.items, 'total', i.total, 'created_at', i.created_at,
        'due_date', i.due_date) order by i.created_at desc)
      from invoices i where i.client_id = c.id), '[]'::json))
  from clients c
  left join profiles p on p.id = c.user_id
  where c.public_token = p_token
$$;
revoke all on function public.get_portal_data(uuid) from public;
grant execute on function public.get_portal_data(uuid) to anon, authenticated;

-- Owner-only pattern for every other table (already applied):
--   business_constraints, cash_receipts, client_payment_behavior,
--   expenses, work_orders. Tables with no policies (waitlist,
--   processed_webhook_events) stay locked to service role only.
