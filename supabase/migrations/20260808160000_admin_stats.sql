-- ============================================================================
-- Migration 0004: admin statistics
--
-- `scans` and `participants` are restricted to super_admin because they hold
-- IP addresses and emails. A regular `admin` still needs to see how the
-- campaign is doing, so these SECURITY DEFINER functions return counts and
-- aggregates only — never a row that identifies anyone.
-- ============================================================================

-- Headline numbers for the dashboard.
create or replace function admin_overview()
returns table (
  total_players        bigint,
  active_players_24h   bigint,
  total_scans          bigint,
  scans_24h            bigint,
  completed_all        bigint,
  offers_activated     bigint,
  offers_outstanding   bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from participants),
    (select count(distinct participant_id) from scans
      where scanned_at > now() - interval '24 hours'),
    (select count(*) from scans),
    (select count(*) from scans where scanned_at > now() - interval '24 hours'),
    (select count(*) from (
       select participant_id from scans
       group by participant_id
       having count(distinct location_id) = (select count(*) from locations where active)
     ) t),
    (select count(*) from redemptions where started_at is not null),
    (select count(*) from redemptions where started_at is null)
  where is_staff();
$$;

-- How far people get: how many hold 1, 2, 3 or 4 codes.
create or replace function admin_funnel()
returns table (codes_found int, players bigint)
language sql
stable
security definer
set search_path = public
as $$
  select found::int, count(*)
  from (
    select participant_id, count(distinct location_id) as found
    from scans
    group by participant_id
  ) t
  where is_staff()
  group by found
  order by found;
$$;

-- Per-location performance, including offer take-up.
create or replace function admin_locations_report()
returns table (
  location_id     uuid,
  day_number      smallint,
  sort_order      smallint,
  location_name   text,
  offer_title     text,
  active          boolean,
  live_from       timestamptz,
  live_until      timestamptz,
  scan_count      bigint,
  activated_count bigint,
  first_scan      timestamptz,
  last_scan       timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.day_number,
    l.sort_order,
    l.location_name,
    l.offer_title,
    l.active,
    l.live_from,
    l.live_until,
    count(s.id),
    count(r.started_at),
    min(s.scanned_at),
    max(s.scanned_at)
  from locations l
  left join scans s       on s.location_id = l.id
  left join redemptions r on r.scan_id = s.id
  where is_staff()
  group by l.id, l.day_number, l.sort_order, l.location_name,
           l.offer_title, l.active, l.live_from, l.live_until
  order by l.sort_order;
$$;

-- Scans per day, for a trend line.
create or replace function admin_daily_scans()
returns table (day date, scans bigint, players bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (scanned_at at time zone 'Europe/London')::date as day,
    count(*),
    count(distinct participant_id)
  from scans
  where is_staff()
  group by 1
  order by 1;
$$;

-- How many people would be affected by a destructive change. Used to put a
-- real number in front of someone before they rotate the code or move a
-- location's digit positions.
create or replace function admin_impact(p_location_id uuid default null)
returns table (affected_players bigint)
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct participant_id)
  from scans
  where is_staff()
    and (p_location_id is null or location_id = p_location_id);
$$;

revoke all on function admin_overview(), admin_funnel(), admin_locations_report(),
                      admin_daily_scans(), admin_impact(uuid) from anon;
grant execute on function admin_overview(), admin_funnel(), admin_locations_report(),
                          admin_daily_scans(), admin_impact(uuid) to authenticated;
