import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';

/**
 * POST /api/staff/reset  { confirm: 'RESET' }
 *
 * Clears everyone who has played. Runs through the staff client so the
 * function's own super-admin check does the enforcing rather than this route
 * being trusted.
 */
export async function POST(request: Request) {
  const staff = await getStaffRole();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Super admins only.' }, { status: 403 });
  }

  let body: { confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (body.confirm !== 'RESET') {
    return Response.json({ error: 'Type RESET to confirm.' }, { status: 400 });
  }

  const supabase = await getStaffClient();
  const { data, error } = await supabase.rpc('reset_play_data');

  if (error) {
    // The function raises a readable exception for the live-campaign case.
    return Response.json(
      { error: error.message.replace(/^.*?:\s*/, '') || 'Could not reset.' },
      { status: 409 },
    );
  }

  return Response.json({ result: data?.[0] ?? null });
}
