import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';

/** PATCH /api/staff/team  { user_id, role } — change someone's rank. */
export async function PATCH(request: Request) {
  const staff = await getStaffRole();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Super admins only.' }, { status: 403 });
  }

  let body: { user_id?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const userId = typeof body.user_id === 'string' ? body.user_id : '';
  const role = body.role === 'admin' || body.role === 'super_admin' ? body.role : null;

  if (!userId || !role) {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const supabase = await getStaffClient();

  // Don't let the last super admin demote themselves out of the door.
  if (role === 'admin') {
    const { count } = await supabase
      .from('staff')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if ((count ?? 0) <= 1) {
      return Response.json(
        { error: 'There has to be at least one super admin.' },
        { status: 409 },
      );
    }
  }

  const { error } = await supabase.from('staff').update({ role }).eq('user_id', userId);
  if (error) return Response.json({ error: 'Could not change that.' }, { status: 500 });

  return Response.json({ ok: true });
}
