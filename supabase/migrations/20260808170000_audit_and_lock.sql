-- ============================================================================
-- Migration 0005: audit trail for admin changes
--
-- During opening week someone will ask "who turned that code off". The
-- audit_log table has existed since 0001 but only code rotation was writing to
-- it. These triggers cover every admin write.
--
-- campaign_secrets is logged as an event only — never the code itself. The
-- log is super-admin readable, but a secret that appears in two places is a
-- secret kept in two places.
-- ============================================================================

create or replace function log_location_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed text[];
begin
  if TG_OP = 'UPDATE' then
    select array_agg(key) into changed
    from jsonb_each(to_jsonb(NEW))
    where to_jsonb(NEW) -> key is distinct from to_jsonb(OLD) -> key;

    if changed is null then
      return NEW;
    end if;

    insert into audit_log (staff_id, action, detail)
    values (
      auth.uid(),
      'location.update',
      jsonb_build_object(
        'location_id', NEW.id,
        'location_name', NEW.location_name,
        'changed', changed,
        'active', NEW.active
      )
    );
    return NEW;
  end if;

  insert into audit_log (staff_id, action, detail)
  values (
    auth.uid(),
    'location.' || lower(TG_OP),
    jsonb_build_object('location_id', coalesce(NEW.id, OLD.id))
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger locations_audit
  after insert or update or delete on locations
  for each row execute function log_location_change();

create or replace function log_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (staff_id, action, detail)
  values (
    auth.uid(),
    'campaign.update',
    jsonb_build_object(
      'starts_at', NEW.starts_at,
      'ends_at', NEW.ends_at,
      'is_won', NEW.is_won
    )
  );
  return NEW;
end;
$$;

create trigger campaign_settings_audit
  after update on campaign_settings
  for each row execute function log_settings_change();

-- Event only. The code never enters the log.
create or replace function log_secret_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (staff_id, action, detail)
  values (auth.uid(), 'safe_code.rotated', jsonb_build_object('at', now()));
  return NEW;
end;
$$;

create trigger campaign_secrets_audit
  after update on campaign_secrets
  for each row execute function log_secret_change();

create or replace function log_staff_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (staff_id, action, detail)
  values (
    auth.uid(),
    'staff.' || lower(TG_OP),
    jsonb_build_object('subject', coalesce(NEW.user_id, OLD.user_id), 'role', NEW.role)
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger staff_audit
  after insert or update or delete on staff
  for each row execute function log_staff_change();

-- Recent activity for the admin screens.
create or replace function admin_recent_activity(p_limit int default 30)
returns table (
  id         bigint,
  action     text,
  detail     jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.action, a.detail, a.created_at
  from audit_log a
  where is_staff()
  order by a.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function admin_recent_activity(int) from anon;
grant execute on function admin_recent_activity(int) to authenticated;
