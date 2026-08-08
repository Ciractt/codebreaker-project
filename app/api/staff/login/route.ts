import { getStaffClient } from '@/lib/supabase/staff';
import { isLockedOut, recordAttempt } from '@/lib/login-throttle';
import { clientIp } from '@/lib/request-ip';

/**
 * POST /api/staff/login  { email, password }
 *
 * Every failure path returns the same message. Distinguishing "no such
 * account" from "wrong password" from "no campaign access" hands over a list
 * of who works here, and the third one in particular confirmed a valid
 * Supabase account.
 */
const GENERIC = 'Those details didn\u2019t work.';

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const ip = clientIp(request);

  if (!email || !password) {
    return Response.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  if (await isLockedOut(email)) {
    return Response.json(
      { error: 'Too many attempts. Wait fifteen minutes and try again.' },
      { status: 429 },
    );
  }

  const supabase = await getStaffClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await recordAttempt(email, ip, false);
    return Response.json({ error: GENERIC }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!staff) {
    await supabase.auth.signOut();
    await recordAttempt(email, ip, false);
    return Response.json({ error: GENERIC }, { status: 401 });
  }

  await recordAttempt(email, ip, true);
  return Response.json({ role: staff.role });
}
