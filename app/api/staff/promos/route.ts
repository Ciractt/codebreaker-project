import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';

/**
 * POST   /api/staff/promos   { title, image_url, link_url?, active?, sort_order? }
 * PATCH  /api/staff/promos   { id, ...fields }
 * DELETE /api/staff/promos   { id }
 *
 * Nothing here is destructive to the puzzle, so no impact confirmations —
 * a banner going wrong costs a refresh, not somebody's numbers.
 */

const FIELDS = ['title', 'image_url', 'link_url', 'active', 'sort_order'] as const;

function validate(body: Record<string, unknown>): string | null {
  if ('title' in body && (typeof body.title !== 'string' || !body.title.trim())) {
    return 'Give it a title — it doubles as the alt text.';
  }
  if ('image_url' in body && (typeof body.image_url !== 'string' || !body.image_url.trim())) {
    return 'An image path is required.';
  }
  if ('link_url' in body && body.link_url) {
    if (typeof body.link_url !== 'string' || !/^https?:\/\//i.test(body.link_url)) {
      return 'Links need to start with https://';
    }
  }
  return null;
}

async function guard() {
  const staff = await getStaffRole();
  if (!staff) return { error: 'Sign in first.', status: 401 };
  if (staff.role !== 'super_admin') return { error: 'Super admins only.', status: 403 };
  return null;
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const problem = validate(body);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const insert: Record<string, unknown> = {};
  for (const field of FIELDS) if (field in body) insert[field] = body[field] || null;
  insert.title = body.title;
  insert.image_url = body.image_url;

  const supabase = await getStaffClient();
  const { data, error } = await supabase.from('promos').insert(insert).select('id').single();

  if (error) return Response.json({ error: 'Could not add that.' }, { status: 500 });
  return Response.json({ promo: data });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return Response.json({ error: 'Which banner?' }, { status: 400 });

  const problem = validate(body);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of FIELDS) {
    if (field in body) update[field] = field === 'link_url' ? body[field] || null : body[field];
  }

  const supabase = await getStaffClient();
  const { error } = await supabase.from('promos').update(update).eq('id', id);

  if (error) return Response.json({ error: 'Could not save that.' }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return Response.json({ error: 'Which banner?' }, { status: 400 });

  const supabase = await getStaffClient();
  const { error } = await supabase.from('promos').delete().eq('id', id);

  if (error) return Response.json({ error: 'Could not remove that.' }, { status: 500 });
  return Response.json({ ok: true });
}
