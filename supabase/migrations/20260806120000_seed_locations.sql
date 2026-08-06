-- ============================================================================
-- Migration 0002: seed campaign settings and the four locations
--
-- IMPORTANT
--   The mapping of code positions -> QR codes is generated RANDOMLY at insert
--   time and lives only in the database. Do not hardcode it here. Anyone
--   holding this repo plus all four sets of numbers would otherwise have the
--   full safe code.
--
--   Location 1 (day one) reveals positions 1 and 2 AND tells the player where
--   they sit. Locations 2-4 get a random pair from positions 3-8 and reveal
--   nothing about placement.
--
-- BEFORE RUNNING: fill in the real location names and the live_from /
-- live_until timestamps. Everything marked TODO.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Campaign window
-- ---------------------------------------------------------------------------

insert into campaign_settings (id, campaign_name, starts_at, ends_at)
values (
  true,
  'Code Breaker: Darlington',
  -- TODO: real campaign window, Europe/London
  '2026-09-01 09:00:00+01',
  '2026-09-03 22:00:00+01'
)
on conflict (id) do update
  set campaign_name = excluded.campaign_name,
      starts_at     = excluded.starts_at,
      ends_at       = excluded.ends_at,
      updated_at    = now();

-- ---------------------------------------------------------------------------
-- Locations
-- ---------------------------------------------------------------------------

with
-- The six positions the hint does not cover, shuffled and dealt into pairs
shuffled as (
  select p, row_number() over (order by random()) as rn
  from unnest(array[1,2,4,5,6,7]) as p
),
dealt as (
  select
    ((rn - 1) / 2)::int + 2       as loc_index,   -- yields 2, 3, 4
    array_agg(p order by p)::smallint[] as positions
  from shuffled
  group by ((rn - 1) / 2)::int
),
-- Day one is fixed: positions 3 and 8, and it says so
hint as (
  select 1 as loc_index, array[3,8]::smallint[] as positions
),
allocation as (
  select * from hint
  union all
  select loc_index, positions from dealt
),
-- TODO: replace names, days and offer copy with the confirmed detail
meta (loc_index, day_number, location_name, is_in_store,
      offer_title, offer_description, live_from, live_until) as (
  values
    (1, 1::smallint, 'TODO: Day 1 location', false,
     'Free Baja Blast',
     'Claim a free Baja Blast at Taco Bell Darlington.',
     '2026-09-01 09:00:00+01'::timestamptz, '2026-09-01 22:00:00+01'::timestamptz),

    (2, 2::smallint, 'TODO: Day 2 location', false,
     'Free Crunchy Taco',
     'Claim a free Crunchy Taco at Taco Bell Darlington.',
     '2026-09-02 09:00:00+01'::timestamptz, '2026-09-02 22:00:00+01'::timestamptz),

    (3, 3::smallint, 'TODO: Day 3 location', false,
     'Free Cinnamon Twists',
     'Claim free Cinnamon Twists at Taco Bell Darlington.',
     '2026-09-03 09:00:00+01'::timestamptz, '2026-09-03 22:00:00+01'::timestamptz),

    (4, 3::smallint, 'TODO: In-store, Taco Bell Darlington', true,
     'Free Churros',
     'Claim free Churros at Taco Bell Darlington.',
     '2026-09-03 09:00:00+01'::timestamptz, '2026-09-03 22:00:00+01'::timestamptz)
)
insert into locations (
  day_number, sort_order, slug, location_name, is_in_store,
  digit_positions, reveals_positions,
  live_from, live_until,
  offer_title, offer_description, active
)
select
  m.day_number,
  m.loc_index::smallint,
  encode(gen_random_bytes(8), 'hex'),        -- 16 hex chars, unguessable
  m.location_name,
  m.is_in_store,
  a.positions,
  (m.loc_index = 1),                         -- only day one reveals placement
  m.live_from,
  m.live_until,
  m.offer_title,
  m.offer_description,
  true
from meta m
join allocation a on a.loc_index = m.loc_index;

-- ---------------------------------------------------------------------------
-- Sanity checks — these should all pass
-- ---------------------------------------------------------------------------

do $$
declare
  all_positions smallint[];
  n_locations   int;
begin
  select count(*) into n_locations from locations where active;
  if n_locations <> 4 then
    raise exception 'Expected 4 active locations, found %', n_locations;
  end if;

  select array_agg(p order by p) into all_positions
  from locations, unnest(digit_positions) p
  where active;

  if all_positions <> array[1,2,3,4,5,6,7,8]::smallint[] then
    raise exception 'Positions 1-8 are not covered exactly once: %', all_positions;
  end if;

  raise notice 'Seed OK — 4 locations, positions 1-8 each allocated once.';
end $$;

-- ---------------------------------------------------------------------------
-- Retrieve the QR URLs (super admin only). Run separately, do not commit output.
--
--   select day_number, location_name, offer_title,
--          'https://YOURDOMAIN/s/' || slug as qr_url
--   from locations order by sort_order;
-- ---------------------------------------------------------------------------
