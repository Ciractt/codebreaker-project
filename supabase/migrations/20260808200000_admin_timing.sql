-- ============================================================================
-- Migration 0008: when people actually scan
--
-- The stats so far answer how many. This answers when, which is the question
-- an ops person asks: how many staff on at what time, and whether the codes
-- are being found in the hour after they go live or eight hours later.
-- ============================================================================

create or replace function admin_hourly_scans()
returns table (hour int, scans bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    extract(hour from (scanned_at at time zone 'Europe/London'))::int as hour,
    count(*)
  from scans
  where is_staff()
  group by 1
  order by 1;
$$;

-- Take-up: of the people who scanned a code, how many actually claimed the
-- food. A code with plenty of scans and few claims is a code in the wrong
-- place — people find it, but not on their way to the restaurant.
create or replace function admin_offer_takeup()
returns table (
  location_id   uuid,
  day_number    smallint,
  location_name text,
  offer_title   text,
  scans         bigint,
  claimed       bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.day_number,
    l.location_name,
    l.offer_title,
    count(s.id),
    count(r.started_at)
  from locations l
  left join scans s       on s.location_id = l.id
  left join redemptions r on r.scan_id = s.id
  where is_staff()
  group by l.id, l.day_number, l.location_name, l.offer_title, l.sort_order
  order by l.sort_order;
$$;

revoke all on function admin_hourly_scans(), admin_offer_takeup() from anon;
grant execute on function admin_hourly_scans(), admin_offer_takeup() to authenticated;
