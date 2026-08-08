import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';

/**
 * PATCH /api/staff/campaign
 *   { campaign_name?, starts_at?, ends_at?, is_won? }        — settings
 *   { safe_code, confirmDestructive? }                        — rotate the code
 *
 * Rotating the code is the single most destructive thing in this admin. Every
 * number already handed out was derived from the old one, so everyone holding
 * numbers is suddenly holding the wrong ones. It exists because a leak needs an
 * answer, not because it should be routine.
 */
export async function PATCH(request: Request) {
  const staff = await getStaffRole();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Super admins only.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const supabase = await getStaffClient();

  if (typeof body.safe_code === 'string') {
    const code = body.safe_code.trim();

    if (!/^[1-9]{8}$/.test(code)) {
      return Response.json(
        { error: 'Eight digits, each 1 to 9. No zeros.' },
        { status: 400 },
      );
    }
    if (new Set(code).size !== 8) {
      return Response.json(
        { error: 'Every digit has to be different — a repeat halves the difficulty.' },
        { status: 400 },
      );
    }

    const affected = await getImpact(supabase);
    if (affected > 0 && body.confirmDestructive !== true) {
      return Response.json(
        {
          needsConfirm: true,
          affected,
          message: `${affected} ${affected === 1 ? 'person is' : 'people are'} holding numbers from the current code. Rotating makes all of them wrong.`,
        },
        { status: 409 },
      );
    }

    const { error } = await supabase
      .from('campaign_secrets')
      .update({ safe_code: code, rotated_at: new Date().toISOString() })
      .eq('id', true);

    if (error) return Response.json({ error: 'Could not rotate the code.' }, { status: 500 });

    await supabase.from('audit_log').insert({
      action: 'rotate_safe_code',
      detail: { affected },
    });

    return Response.json({ ok: true, affected });
  }

  const update: Record<string, unknown> = {};
  for (const field of ['campaign_name', 'starts_at', 'ends_at', 'is_won'] as const) {
    if (field in body) update[field] = body[field];
  }
  if (body.is_won === true) update.won_at = new Date().toISOString();
  update.updated_at = new Date().toISOString();

  const { error } = await supabase.from('campaign_settings').update(update).eq('id', true);
  if (error) return Response.json({ error: 'Could not save that.' }, { status: 500 });

  return Response.json({ ok: true });
}
