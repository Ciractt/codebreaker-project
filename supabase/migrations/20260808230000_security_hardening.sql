-- ============================================================================
-- Migration 0011: security hardening
--
-- Two problems, one of them real.
--
-- 1. The three views from 0001 are SECURITY DEFINER and were only revoked from
--    `anon`. Supabase grants new objects in `public` to `authenticated` by
--    default, so anyone holding an authenticated session could read them
--    directly and skip the is_staff() wrapper entirely. The wrapper functions
--    were doing the checking; the views underneath were wide open to any
--    logged-in role.
--
--    That only bites if someone who is not staff can obtain an authenticated
--    session — which is exactly what happens if email signups are left enabled
--    in the Supabase dashboard, because the anon key is public by design.
--
-- 2. Nothing throttled failed sign-ins. Store managers pick memorable
--    passwords; an unthrottled login is a slow brute force waiting to happen.
-- ============================================================================

-- --- 1. Close the views --------------------------------------------------

revoke all on v_scans, v_campaign_stats, v_location_performance
  from anon, authenticated, public;

-- The wrapper functions are SECURITY DEFINER and owned by the same role, so
-- they still read the views. Nothing else can.

-- Belt and braces for anything added later in this schema.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- --- 2. Throttle sign-ins ------------------------------------------------

create table login_attempts (
  id          bigserial primary key,
  identifier  text not null,          -- lowercased email
  ip          inet,
  succeeded   boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index login_attempts_recent_idx
  on login_attempts (identifier, attempted_at desc);

alter table login_attempts enable row level security;
-- No policies at all: only the service role touches this, from the login route.

comment on table login_attempts is
  'Failed sign-in throttle. Rows older than a day are noise — purge with the retention job.';

-- Extend the retention purge to cover it.
create or replace function purge_personal_data()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update scans set ip_address = null, user_agent = null;
  delete from participants;
  delete from login_attempts;
  insert into audit_log (staff_id, action, detail)
  values (auth.uid(), 'purge_personal_data', jsonb_build_object('at', now()));
end;
$$;

revoke all on function purge_personal_data() from anon, authenticated;
