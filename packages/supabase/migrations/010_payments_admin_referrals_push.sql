-- 010_payments_admin_referrals_push.sql
-- Full payment flow, admin panel, referral program, web push, instant quotes.

-- ============================================================================
-- 1. PAYMENT FLOW ENHANCEMENTS
-- ============================================================================

-- Add webhook tracking fields to payments
alter table public.payments
  add column if not exists mercadopago_preference_id text,
  add column if not exists mercadopago_payment_type text,
  add column if not exists payout_status text not null default 'pending'
    check (payout_status in ('pending', 'scheduled', 'released', 'failed')),
  add column if not exists payout_scheduled_at timestamptz,
  add column if not exists payout_released_at timestamptz,
  add column if not exists webhook_verified boolean not null default false;

-- Payments insert policy (clients can create payments for own shipments)
drop policy if exists "Clients can create payments for own shipments" on public.payments;
create policy "Clients can create payments for own shipments"
on public.payments
for insert
to authenticated
with check (
  exists (
    select 1 from public.shipments s
    where s.id = payments.shipment_id
      and s.client_id = auth.uid()
  )
);

-- Service role can update payments (webhooks)
drop policy if exists "Service role can manage payments" on public.payments;

-- ============================================================================
-- 2. ADMIN ACTIONS AUDIT LOG
-- ============================================================================

create table if not exists public.admin_actions (
  id uuid default uuid_generate_v4() primary key,
  admin_user_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_actions_admin on public.admin_actions(admin_user_id);
create index if not exists idx_admin_actions_target on public.admin_actions(target_type, target_id);
create index if not exists idx_admin_actions_time on public.admin_actions(created_at desc);

alter table public.admin_actions enable row level security;

-- Only admins can view/insert admin actions
drop policy if exists "Admins can view admin actions" on public.admin_actions;
create policy "Admins can view admin actions"
on public.admin_actions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can insert admin actions" on public.admin_actions;
create policy "Admins can insert admin actions"
on public.admin_actions
for insert
to authenticated
with check (
  admin_user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Admin read policies for all tables
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can view all drivers" on public.drivers;
create policy "Admins can view all drivers"
on public.drivers
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can update all drivers" on public.drivers;
create policy "Admins can update all drivers"
on public.drivers
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can view all shipments" on public.shipments;
create policy "Admins can view all shipments"
on public.shipments
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can update all shipments" on public.shipments;
create policy "Admins can update all shipments"
on public.shipments
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments"
on public.payments
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can view all disputes" on public.shipment_disputes;
create policy "Admins can view all disputes"
on public.shipment_disputes
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can update all disputes" on public.shipment_disputes;
create policy "Admins can update all disputes"
on public.shipment_disputes
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================================
-- 3. REFERRAL SYSTEM
-- ============================================================================

create table if not exists public.referral_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  uses integer not null default 0,
  max_uses integer not null default 50,
  reward_amount numeric(12,2) not null default 500,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_redemptions (
  id uuid default uuid_generate_v4() primary key,
  code_id uuid not null references public.referral_codes(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referrer_reward numeric(12,2) not null default 500,
  referred_reward numeric(12,2) not null default 500,
  referrer_credited boolean not null default false,
  referred_credited boolean not null default false,
  first_shipment_id uuid references public.shipments(id),
  created_at timestamptz not null default now(),
  unique (referred_user_id)
);

create index if not exists idx_referral_codes_user on public.referral_codes(user_id);
create index if not exists idx_referral_codes_code on public.referral_codes(code);
create index if not exists idx_referral_redemptions_code on public.referral_redemptions(code_id);
create index if not exists idx_referral_redemptions_referrer on public.referral_redemptions(referrer_user_id);

alter table public.referral_codes enable row level security;
alter table public.referral_redemptions enable row level security;

-- Users can view/create own referral codes
drop policy if exists "Users can view own referral codes" on public.referral_codes;
create policy "Users can view own referral codes"
on public.referral_codes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own referral codes" on public.referral_codes;
create policy "Users can create own referral codes"
on public.referral_codes
for insert
to authenticated
with check (user_id = auth.uid());

-- Anyone authenticated can read a code (to validate it)
drop policy if exists "Anyone can validate referral codes" on public.referral_codes;
create policy "Anyone can validate referral codes"
on public.referral_codes
for select
to authenticated
using (active = true);

-- Users can view own redemptions
drop policy if exists "Users can view own redemptions" on public.referral_redemptions;
create policy "Users can view own redemptions"
on public.referral_redemptions
for select
to authenticated
using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());

-- Admins can view all referral data
drop policy if exists "Admins can view all referral codes" on public.referral_codes;
create policy "Admins can view all referral codes"
on public.referral_codes
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can view all redemptions" on public.referral_redemptions;
create policy "Admins can view all redemptions"
on public.referral_redemptions
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================================
-- 4. WEB PUSH SUBSCRIPTIONS
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================================
-- 5. INSTANT QUOTE SESSIONS (no auth required, anon-key accessible)
-- ============================================================================

create table if not exists public.quote_sessions (
  id uuid default uuid_generate_v4() primary key,
  session_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  legs jsonb not null default '[]'::jsonb,
  shipment_type text,
  vehicle_type text,
  base_price numeric(12,2),
  final_price numeric(12,2),
  commission numeric(12,2),
  converted boolean not null default false,
  converted_shipment_id uuid references public.shipments(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idx_quote_sessions_token on public.quote_sessions(session_token);
create index if not exists idx_quote_sessions_expires on public.quote_sessions(expires_at);

alter table public.quote_sessions enable row level security;

-- Anon can insert (creating quotes without login)
drop policy if exists "Anyone can create quote sessions" on public.quote_sessions;
create policy "Anyone can create quote sessions"
on public.quote_sessions
for insert
to anon, authenticated
with check (true);

-- Anon can read own quote by token (handled via API, not direct access)
drop policy if exists "Anyone can read quote sessions" on public.quote_sessions;
create policy "Anyone can read quote sessions"
on public.quote_sessions
for select
to anon, authenticated
using (true);

-- ============================================================================
-- 6. DRIVER DOCUMENT EXPIRY VALIDATION FUNCTION
-- ============================================================================

create or replace function public.check_driver_documents_valid(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    d.verified = true
    and d.dni_verified = true
    and (d.license_expiry is null or d.license_expiry > current_date)
    and (d.insurance_expiry is null or d.insurance_expiry > current_date)
    and (d.vtv_expiry is null or d.vtv_expiry > current_date)
  from public.drivers d
  where d.id = p_driver_id;
$$;

grant execute on function public.check_driver_documents_valid(uuid) to authenticated;
grant execute on function public.check_driver_documents_valid(uuid) to service_role;

-- ============================================================================
-- 7. ADMIN STATS MATERIALIZED VIEW (for dashboard performance)
-- ============================================================================

create or replace function public.admin_platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_drivers', (select count(*) from public.drivers),
    'verified_drivers', (select count(*) from public.drivers where verified = true),
    'pending_verification', (select count(*) from public.drivers where verified = false and dni_verified = true),
    'total_shipments', (select count(*) from public.shipments),
    'active_shipments', (select count(*) from public.shipments where status not in ('delivered', 'cancelled')),
    'delivered_shipments', (select count(*) from public.shipments where status = 'delivered'),
    'cancelled_shipments', (select count(*) from public.shipments where status = 'cancelled'),
    'open_disputes', (select count(*) from public.shipment_disputes where status = 'open'),
    'total_revenue', (select coalesce(sum(commission), 0) from public.shipments where status = 'delivered'),
    'total_gmv', (select coalesce(sum(final_price), 0) from public.shipments where status = 'delivered'),
    'total_referrals', (select count(*) from public.referral_redemptions),
    'active_referral_codes', (select count(*) from public.referral_codes where active = true)
  );
$$;

revoke all on function public.admin_platform_stats() from public;
grant execute on function public.admin_platform_stats() to service_role;

-- Realtime for push notifications
alter publication supabase_realtime add table public.push_subscriptions;
