-- ============================================================================
-- Code Breaker — Darlington opening
-- Migration 0001: initial schema
--
-- Design notes:
--   * Participants NEVER connect to Postgres directly. All public traffic goes
--     through Next.js route handlers using the service role key server-side.
--     No policies grant anything to `anon` — that is deliberate.
--   * Two staff ranks:
--       super_admin — sees the safe code, participant emails, IP addresses
--       admin       — sees scans, redemptions and aggregate stats only
--   * Personal data (email, ip) is deliberately isolated so the admin-facing
--     views can be granted without exposing it.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- Staff and roles
-- ============================================================================

create type staff_role as enum ('admin', 'super_admin');

create table staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         staff_role  not null default 'admin',
  display_name text,
  store        text,
  created_at   timestamptz not null default now()
);

comment on table staff is
  'Links a Supabase Auth user to a campaign role. Insert rows manually — there is no self-signup.';

-- SECURITY DEFINER so the policies below can read `staff` without recursing
-- into staff''s own RLS policies.
create or replace function current_staff_role()
returns staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from staff where user_id = auth.uid();
$$;

create or replace function is_super_admin()
returns boolean language sql stable as $$
  select current_staff_role() = 'super_admin';
$$;

create or replace function is_staff()
returns boolean language sql stable as $$
  select current_staff_role() is not null;
$$;

-- ============================================================================
-- Campaign configuration
-- ============================================================================

-- Non-sensitive settings — readable by any staff member.
create table campaign_settings (
  id             boolean primary key default true check (id),  -- singleton
  campaign_name  text        not null default 'Code Breaker: Darlington',
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  is_won         boolean     not null default false,
  won_at         timestamptz,
  updated_at     timestamptz not null default now()
);

-- The safe code itself. Separate table so `admin` can be granted the settings
-- above without ever seeing this.
create table campaign_secrets (
  id              boolean primary key default true check (id),  -- singleton
  safe_code       text not null check (safe_code ~ '^[1-9]{8}$'),
  -- Positions (1-indexed) revealed as the day-one hint.
  hint_positions  smallint[] not null default '{1,2}',
  rotated_at      timestamptz not null default now(),
  rotated_by      uuid references auth.users (id)
);

comment on column campaign_secrets.safe_code is
  '8 distinct digits 1-9. The site never verifies this — cracking happens at the physical safe. Stored so the app can derive each location''s digit reveal, and so it can be rotated if the numbers leak.';

-- ============================================================================
-- Locations (the four QR codes)
-- ============================================================================

create table locations (
  id                 uuid primary key default gen_random_uuid(),
  day_number         smallint not null check (day_number between 1 and 3),
  sort_order         smallint not null,
  slug               text not null unique
                       check (slug ~ '^[a-z0-9]{16}$'),
  location_name      text not null,
  is_in_store        boolean not null default false,

  -- Which positions of the code (1-indexed) this QR reveals.
  digit_positions    smallint[] not null check (array_length(digit_positions, 1) = 2),
  -- Day one reveals where its two numbers sit; the rest do not.
  reveals_positions  boolean not null default false,

  -- Timed release
  live_from          timestamptz not null,
  live_until         timestamptz not null,

  -- Fixed offer
  offer_title        text not null,
  offer_description  text,
  offer_image_url    text,

  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

comment on column locations.slug is
  'Random 16-char token, NOT a guessable name. Anyone with the slug can claim the offer without visiting.';

create index locations_live_idx on locations (live_from, live_until) where active;

-- ============================================================================
-- Participants  ── CONTAINS PERSONAL DATA (email)
-- ============================================================================

create table participants (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (position('@' in email) > 1),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- Case-insensitive uniqueness without needing citext.
create unique index participants_email_key on participants (lower(email));

comment on table participants is
  'RETENTION: purge after the campaign closes. Email is unverified — it is a progress key, not an authenticated identity.';

-- ============================================================================
-- Scans  ── CONTAINS PERSONAL DATA (ip_address)
-- ============================================================================

create table scans (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references participants (id) on delete cascade,
  location_id     uuid not null references locations (id) on delete cascade,
  scanned_at      timestamptz not null default now(),
  ip_address      inet,
  user_agent      text,
  unique (participant_id, location_id)
);

create index scans_participant_idx on scans (participant_id);
create index scans_location_idx    on scans (location_id);

comment on column scans.ip_address is
  'Personal data. Held for fraud detection only — purge on the same schedule as participants.email.';

-- ============================================================================
-- Offer redemptions
-- ============================================================================

create table redemptions (
  id              uuid primary key default gen_random_uuid(),
  scan_id         uuid not null unique references scans (id) on delete cascade,
  redemption_code text not null unique
                    check (redemption_code ~ '^[A-Z0-9]{6}$'),
  started_at      timestamptz,   -- when the customer hit "redeem" in store
  expires_at      timestamptz,   -- started_at + countdown window
  redeemed_at     timestamptz,
  redeemed_by     uuid references auth.users (id)
);

create index redemptions_code_idx on redemptions (redemption_code);

-- ============================================================================
-- Safe attempts (optional logging, if staff choose to record them)
-- ============================================================================

create table safe_attempts (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references participants (id) on delete set null,
  attempted_at   timestamptz not null default now(),
  succeeded      boolean not null default false,
  logged_by      uuid references auth.users (id)
);

-- ============================================================================
-- Audit log — every super-admin read of personal data
-- ============================================================================

create table audit_log (
  id          bigserial primary key,
  staff_id    uuid references auth.users (id),
  action      text not null,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_created_idx on audit_log (created_at desc);

-- ============================================================================
-- Admin-safe views (no email, no IP)
-- ============================================================================

create view v_scans
with (security_invoker = false) as
  select
    s.id,
    s.participant_id,          -- pseudonymous UUID only
    s.location_id,
    l.location_name,
    l.day_number,
    s.scanned_at
  from scans s
  join locations l on l.id = s.location_id;

create view v_campaign_stats
with (security_invoker = false) as
  select
    (select count(*) from participants)                        as total_participants,
    (select count(*) from scans)                               as total_scans,
    (select count(*) from redemptions where redeemed_at is not null)
                                                               as offers_redeemed,
    (select count(*) from (
       select participant_id
       from scans
       group by participant_id
       having count(distinct location_id) = (select count(*) from locations where active)
     ) t)                                                      as completed_all_locations;

create view v_location_performance
with (security_invoker = false) as
  select
    l.id,
    l.day_number,
    l.location_name,
    l.offer_title,
    count(s.id)                                        as scan_count,
    count(r.redeemed_at)                               as redeemed_count,
    min(s.scanned_at)                                  as first_scan,
    max(s.scanned_at)                                  as last_scan
  from locations l
  left join scans s       on s.location_id = l.id
  left join redemptions r on r.scan_id = s.id
  group by l.id, l.day_number, l.location_name, l.offer_title;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table staff             enable row level security;
alter table campaign_settings enable row level security;
alter table campaign_secrets  enable row level security;
alter table locations         enable row level security;
alter table participants      enable row level security;
alter table scans             enable row level security;
alter table redemptions       enable row level security;
alter table safe_attempts     enable row level security;
alter table audit_log         enable row level security;

-- No policies for `anon` anywhere. Public traffic uses the service role
-- key from server-side route handlers, which bypasses RLS by design.

-- staff: you can see yourself; super admins see everyone
create policy staff_self on staff
  for select to authenticated
  using (user_id = auth.uid() or is_super_admin());

create policy staff_manage on staff
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- campaign_settings: any staff reads, super admin writes
create policy settings_read on campaign_settings
  for select to authenticated using (is_staff());
create policy settings_write on campaign_settings
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- campaign_secrets: SUPER ADMIN ONLY
create policy secrets_super_only on campaign_secrets
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- locations: any staff reads, super admin writes
create policy locations_read on locations
  for select to authenticated using (is_staff());
create policy locations_write on locations
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- participants: SUPER ADMIN ONLY (contains email)
create policy participants_super_only on participants
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- scans: raw table is super admin only (contains ip_address).
-- Regular admins read v_scans instead.
create policy scans_super_only on scans
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- redemptions: no personal data — any staff may read, and mark redeemed
create policy redemptions_read on redemptions
  for select to authenticated using (is_staff());
create policy redemptions_update on redemptions
  for update to authenticated
  using (is_staff()) with check (is_staff());

-- safe_attempts: any staff
create policy attempts_all on safe_attempts
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- audit_log: super admin reads; anyone authenticated may append
create policy audit_read on audit_log
  for select to authenticated using (is_super_admin());
create policy audit_insert on audit_log
  for insert to authenticated with check (is_staff());

-- ============================================================================
-- View grants
--
-- The views are SECURITY DEFINER (security_invoker = false), so they run as
-- the view owner and bypass the underlying tables' RLS. That is what lets a
-- regular admin read scan data without being granted the raw table. Access is
-- gated below by an explicit role check wrapper.
-- ============================================================================

revoke all on v_scans, v_campaign_stats, v_location_performance from anon;

create or replace function admin_scans()
returns setof v_scans
language sql stable security definer set search_path = public as $$
  select * from v_scans where is_staff();
$$;

create or replace function admin_stats()
returns setof v_campaign_stats
language sql stable security definer set search_path = public as $$
  select * from v_campaign_stats where is_staff();
$$;

create or replace function admin_location_performance()
returns setof v_location_performance
language sql stable security definer set search_path = public as $$
  select * from v_location_performance where is_staff();
$$;

revoke all on function admin_scans(), admin_stats(), admin_location_performance() from anon;
grant execute on function admin_scans(), admin_stats(), admin_location_performance() to authenticated;

-- ============================================================================
-- Retention helper — run after the campaign closes
-- ============================================================================

create or replace function purge_personal_data()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update scans set ip_address = null, user_agent = null;
  delete from participants;
  insert into audit_log (staff_id, action, detail)
  values (auth.uid(), 'purge_personal_data', jsonb_build_object('at', now()));
end;
$$;

revoke all on function purge_personal_data() from anon, authenticated;

comment on function purge_personal_data is
  'Deletes participant emails and nulls IP addresses. Cascades to scans/redemptions. Call from a server-side job with the service role key once the retention period expires.';
