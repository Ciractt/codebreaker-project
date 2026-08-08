import { getAdminClient } from '@/lib/supabase/admin';
import { getStaffClient, getStaffRole, type StaffRole } from '@/lib/supabase/staff';

/**
 * POST   — create an account
 * PATCH  — change someone's rank        (super admin)
 * DELETE — remove an account            (super admin)
 *
 * Creating an auth user needs the service role, so this is the one staff route
 * that touches it. It is deliberately narrow: the caller's rank is established
 * through their own RLS-bound client first, and the service role is then used
 * for exactly two calls — create the user, delete the user. Nothing here reads
 * participant data.
 */

/** Not a password anyone keeps: they're expected to reset it. */
function temporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

async function caller(): Promise<{ role: StaffRole; email: string } | null> {
  return getStaffRole();
}

export async function POST(request: Request) {
  const staff = await caller();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });

  let body: { email?: unknown; role?: unknown; display_name?: unknown; store?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role: StaffRole =
    body.role === 'super_admin' || body.role === 'admin' ? body.role : 'admin';
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
  const store = typeof body.store === 'string' ? body.store.trim() : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json({ error: 'That doesn\u2019t look like an email address.' }, { status: 400 });
  }
  if (!displayName) {
    return Response.json({ error: 'Give them a name, so the list is readable.' }, { status: 400 });
  }

  // Rank is the one thing an admin cannot hand out above their own level.
  if (role === 'super_admin' && staff.role !== 'super_admin') {
    return Response.json(
      { error: 'Only a super admin can create another super admin.' },
      { status: 403 },
    );
  }

  const admin = getAdminClient();
  const password = temporaryPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const already = createError?.message?.toLowerCase().includes('already');
    return Response.json(
      {
        error: already
          ? 'There\u2019s already an account with that address.'
          : 'Could not create that account.',
      },
      { status: already ? 409 : 500 },
    );
  }

  const { error: staffError } = await admin.from('staff').insert({
    user_id: created.user.id,
    role,
    display_name: displayName,
    store: store || null,
  });

  if (staffError) {
    // Don't leave an auth user with no rank — it could sign in and see nothing,
    // which is confusing rather than dangerous, but still wrong.
    await admin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: 'Could not finish setting them up.' }, { status: 500 });
  }

  await admin.from('audit_log').insert({
    action: 'staff.created',
    detail: { email, role, by: staff.email },
  });

  return Response.json({ email, password, role });
}

export async function PATCH(request: Request) {
  const staff = await caller();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Only a super admin can change ranks.' }, { status: 403 });
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

export async function DELETE(request: Request) {
  const staff = await caller();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Only a super admin can remove accounts.' }, { status: 403 });
  }

  let body: { user_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const userId = typeof body.user_id === 'string' ? body.user_id : '';
  if (!userId) return Response.json({ error: 'Which account?' }, { status: 400 });

  const supabase = await getStaffClient();

  const { data: subject } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (subject?.role === 'super_admin') {
    const { count } = await supabase
      .from('staff')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if ((count ?? 0) <= 1) {
      return Response.json(
        { error: 'That\u2019s the last super admin. Promote someone else first.' },
        { status: 409 },
      );
    }
  }

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return Response.json({ error: 'Could not remove that account.' }, { status: 500 });

  await admin.from('audit_log').insert({
    action: 'staff.removed',
    detail: { user_id: userId, by: staff.email },
  });

  return Response.json({ ok: true });
}
