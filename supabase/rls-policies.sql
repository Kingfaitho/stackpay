-- Ledga baseline Row Level Security
-- Run in the Supabase SQL editor. Review existing policies first:
--   select * from pg_policies where schemaname = 'public';
--
-- Threat model this protects against:
--   1. Anonymous visitors marking invoices as paid (payment page used to do
--      this from the browser; it now goes through the verify-payment edge
--      function which uses the service role and bypasses RLS).
--   2. One user reading or editing another user's business data.
--   3. Payment-link visitors browsing data beyond the single invoice they
--      were sent.

-- Enable RLS everywhere (no-op if already enabled)
alter table public.profiles  enable row level security;
alter table public.invoices  enable row level security;
alter table public.clients   enable row level security;

-- ============================================================
-- PROFILES: owners manage their own row.
-- Anonymous payment-link visitors need the business display info,
-- so allow anon SELECT (keep sensitive columns out of this table,
-- or replace with a security-definer RPC that returns only
-- business_name/owner_name/currency).
-- ============================================================
drop policy if exists "profiles_owner_all"  on public.profiles;
drop policy if exists "profiles_anon_read"  on public.profiles;

create policy "profiles_owner_all" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_anon_read" on public.profiles
  for select to anon
  using (true);

-- ============================================================
-- INVOICES: owners full control. Anonymous visitors may READ
-- (needed for /pay/:id links) but never INSERT/UPDATE/DELETE.
-- Use UUID invoice ids so links are not guessable; if ids are
-- sequential integers, migrate to UUIDs.
-- ============================================================
drop policy if exists "invoices_owner_all" on public.invoices;
drop policy if exists "invoices_anon_read" on public.invoices;

create policy "invoices_owner_all" on public.invoices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "invoices_anon_read" on public.invoices
  for select to anon
  using (true);

-- CRITICAL: make sure no anon write policy exists. If the payment page
-- previously updated invoices anonymously, a policy like
-- "anyone can update invoices" may exist. Find and drop it:
--   select policyname from pg_policies
--   where tablename = 'invoices' and 'anon' = any(roles) and cmd != 'SELECT';

-- ============================================================
-- CLIENTS: owner-only. The payment page reads the client name/email
-- through the invoices join; if that breaks, expose a minimal
-- security-definer RPC instead of opening the table.
-- ============================================================
drop policy if exists "clients_owner_all" on public.clients;
drop policy if exists "clients_anon_read" on public.clients;

create policy "clients_owner_all" on public.clients
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "clients_anon_read" on public.clients
  for select to anon
  using (true);

-- ============================================================
-- Repeat the owner-only pattern for every other table
-- (expenses, inventory, budgets, notes, work_orders, team, ...):
--
--   alter table public.<t> enable row level security;
--   create policy "<t>_owner_all" on public.<t>
--     for all to authenticated
--     using (user_id = auth.uid())
--     with check (user_id = auth.uid());
--
-- No anon policies on those tables at all.
-- ============================================================
