-- ============================================================================
-- Migration 0012: reset the play data
--
-- Wipes everyone who has played and everything they did, and leaves the
-- campaign itself standing: locations, offers, artwork, the safe code, the
-- position mapping, promos and staff accounts all survive.
--
-- Refuses outright while the campaign is live. There is no moment during three
-- days in Darlington when deleting every participant is the right answer, and
-- an override would only exist to be clicked by mistake at the worst time.
--
-- The audit log is deliberately NOT cleared. It is the record of what
-- happened, including this — a reset that erases its own trace is the one an
-- attacker would want.
-- ============================================================================

create or replace function reset_play_data()
returns table (
  participants_removed bigint,
  scans_removed        bigint,
  attempts_removed     bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_live         boolean;
  v_participants bigint;
  v_scans        bigint;
  v_attempts     bigint;
begin
  if not is_super_admin() then
    raise exception 'Only a super admin can reset play data.';
  end if;

  select (now() >= starts_at and now() <= ends_at)
    into v_live
  from campaign_settings
  where id = true;

  if coalesce(v_live, false) then
    raise exception 'The campaign is live. Move the dates first if you really mean this.';
  end if;

  select count(*) into v_participants from participants;
  select count(*) into v_scans from scans;
  select count(*) into v_attempts from safe_attempts;

  -- scans and redemptions cascade from participants.
  delete from participants;
  delete from safe_attempts;
  delete from login_attempts;

  insert into audit_log (staff_id, action, detail)
  values (
    auth.uid(),
    'play_data.reset',
    jsonb_build_object(
      'participants', v_participants,
      'scans', v_scans,
      'safe_attempts', v_attempts
    )
  );

  return query select v_participants, v_scans, v_attempts;
end;
$$;

revoke all on function reset_play_data() from anon;
grant execute on function reset_play_data() to authenticated;
