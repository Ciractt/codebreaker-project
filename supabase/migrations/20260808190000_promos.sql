-- ============================================================================
-- Migration 0007: promo slot
--
-- A single banner beneath the player-facing content, for Taco Bell to point at
-- whatever they want promoted alongside the campaign. A table rather than
-- columns on campaign_settings, so a second slot doesn't need a migration.
-- ============================================================================

create table promos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,              -- also the image's alt text
  image_url   text not null,
  link_url    text,
  active      boolean not null default true,
  sort_order  smallint not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column promos.title is
  'Doubles as alt text, so write what the banner says rather than naming the file.';

comment on column promos.link_url is
  'Optional. When set the banner opens it in a new tab and shows an external-link mark.';

alter table promos enable row level security;

-- No anon policy: player traffic reads this server-side through the service
-- role, same as everything else.
create policy promos_read on promos
  for select to authenticated using (is_staff());

create policy promos_write on promos
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

create or replace function log_promo_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (staff_id, action, detail)
  values (
    auth.uid(),
    'promo.' || lower(TG_OP),
    jsonb_build_object('title', coalesce(NEW.title, OLD.title), 'active', NEW.active)
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger promos_audit
  after insert or update or delete on promos
  for each row execute function log_promo_change();

insert into promos (title, image_url, link_url, active, sort_order)
values (
  'Live Más Club — exclusive access for the fans',
  '/promos/live-mas-club.jpg',
  null,
  true,
  1
);
