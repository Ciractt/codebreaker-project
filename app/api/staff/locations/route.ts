import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';

/**
 * PATCH /api/staff/locations  { id, ...fields, confirmDestructive? }
 *
 * Editable without ceremony: name, offer copy, image, dates, active flag.
 *
 * Two fields are destructive once people have scanned, and both require an
 * explicit confirm:
 *   digit_positions — changes which numbers this code hands out, so anyone who
 *                     already scanned it is holding the wrong ones
 *   regenerateSlug  — invalidates every QR code already printed
 */

const SAFE_FIELDS = [
  'location_name',
  'offer_title',
  'offer_description',
  'offer_image_url',
  'live_from',
  'live_until',
  'active',
  'day_number',
] as const;

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

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return Response.json({ error: 'Which code?' }, { status: 400 });

  const supabase = await getStaffClient();

  const update: Record<string, unknown> = {};
  for (const field of SAFE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const wantsPositions = Array.isArray(body.digit_positions);
  const wantsNewSlug = body.regenerateSlug === true;

  if (wantsPositions || wantsNewSlug) {
    const affected = await getImpact(supabase, id);

    if (affected > 0 && body.confirmDestructive !== true) {
      return Response.json(
        {
          needsConfirm: true,
          affected,
          message: wantsNewSlug
            ? `${affected} ${affected === 1 ? 'person has' : 'people have'} scanned this code. A new link makes every printed QR for it useless.`
            : `${affected} ${affected === 1 ? 'person is' : 'people are'} already holding numbers from this code. Changing the positions makes theirs wrong.`,
        },
        { status: 409 },
      );
    }

    if (wantsPositions) {
      const positions = (body.digit_positions as unknown[]).map(Number);
      if (positions.length !== 2 || positions.some((p) => !Number.isInteger(p) || p < 1 || p > 8)) {
        return Response.json(
          { error: 'Two positions, each between 1 and 8.' },
          { status: 400 },
        );
      }

      // Positions must stay a clean partition of 1-8 across all four codes.
      const { data: others } = await supabase
        .from('locations')
        .select('id, digit_positions')
        .eq('active', true)
        .neq('id', id);

      const taken = new Set((others ?? []).flatMap((row) => row.digit_positions as number[]));
      if (positions.some((p) => taken.has(p))) {
        return Response.json(
          { error: 'Another code already covers one of those positions.' },
          { status: 400 },
        );
      }

      update.digit_positions = positions;
    }

    if (wantsNewSlug) {
      update.slug = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  }

  if (typeof body.reveals_positions === 'boolean') {
    update.reveals_positions = body.reveals_positions;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nothing to change.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('locations')
    .update(update)
    .eq('id', id)
    .select('id, slug')
    .single();

  if (error) return Response.json({ error: 'Could not save that.' }, { status: 500 });

  return Response.json({ location: data });
}
