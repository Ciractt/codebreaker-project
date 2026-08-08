-- ============================================================================
-- Migration 0010: team visibility
--
-- Everyone with a back-office account can see who else has one and what rank
-- they hold. That is not a leak — it is how a team knows who to ask when
-- something needs changing, and it makes an unexpected account obvious to more
-- than one person.
--
-- Emails come through a SECURITY DEFINER function rather than by granting
-- anyone access to auth.users.
-- ============================================================================

drop policy if exists staff_self on staff;

create policy staff_read_all on staff
  for select to authenticated
  using (is_staff());

create or replace function admin_team()
returns table (
  user_id      uuid,
  email        text,
  role         staff_role,
  display_name text,
  store        text,
  created_at   timestamptz,
  last_sign_in timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.user_id,
    u.email::text,
    s.role,
    s.display_name,
    s.store,
    s.created_at,
    u.last_sign_in_at
  from staff s
  join auth.users u on u.id = s.user_id
  where is_staff()
  order by s.role desc, s.created_at;
$$;

revoke all on function admin_team() from anon;
grant execute on function admin_team() to authenticated;
