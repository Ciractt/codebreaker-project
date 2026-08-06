import { getStaffClient } from '@/lib/supabase/staff';

/** POST /api/staff/login  { email, password } */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return Response.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const supabase = await getStaffClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return Response.json({ error: 'Those details didn\u2019t work.' }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!staff) {
    await supabase.auth.signOut();
    return Response.json(
      { error: 'That account has no campaign access. Ask an admin to add you.' },
      { status: 403 },
    );
  }

  return Response.json({ role: staff.role });
}
