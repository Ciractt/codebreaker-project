import { getAdminClient } from '@/lib/supabase/admin';
import { checkLocationAvailability, getParticipantProgress } from '@/lib/code';
import { findOrCreateParticipant, normaliseEmail, recordScan } from '@/lib/participants';
import { writeSession } from '@/lib/session';

/**
 * POST /api/scan  { slug, email }
 *
 * The only route that turns a QR scan into numbers. Everything it returns is
 * derived server-side from rows in `scans` — the client cannot claim a scan
 * it has not made.
 */

export async function POST(request: Request) {
  let body: { slug?: unknown; email?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';

  if (!/^[a-z0-9]{16}$/.test(slug)) {
    return Response.json({ error: 'That code isn\u2019t one of ours.' }, { status: 400 });
  }

  const email = normaliseEmail(rawEmail);
  if (!email) {
    return Response.json({ error: 'Enter an email address we can use.' }, { status: 400 });
  }

  const supabase = getAdminClient();

  const availability = await checkLocationAvailability(supabase, slug);

  if (!availability.available || !availability.locationId) {
    const messages: Record<string, string> = {
      not_found: 'That code isn\u2019t one of ours.',
      inactive: 'That code isn\u2019t in play.',
      not_yet_live: 'This one goes live later. Come back then.',
      expired: 'This code has closed.',
    };
    return Response.json(
      {
        error: messages[availability.reason] ?? 'That code isn\u2019t available.',
        reason: availability.reason,
        liveFrom: availability.liveFrom ?? null,
      },
      { status: 409 },
    );
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : null;
  const userAgent = request.headers.get('user-agent');

  try {
    const participantId = await findOrCreateParticipant(supabase, email);
    const { alreadyScanned } = await recordScan(
      supabase,
      participantId,
      availability.locationId,
      ip,
      userAgent,
    );

    await writeSession(participantId);

    const progress = await getParticipantProgress(supabase, participantId);

    return Response.json({ alreadyScanned, progress });
  } catch {
    return Response.json(
      { error: 'Something went wrong saving that. Try scanning again.' },
      { status: 500 },
    );
  }
}
