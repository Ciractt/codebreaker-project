import { getAdminClient } from '@/lib/supabase/admin';
import { activateOffer } from '@/lib/offers';
import { readSession } from '@/lib/session';

/** POST /api/redeem  { scanId } — activates the offer and starts its countdown. */
export async function POST(request: Request) {
  const participantId = await readSession();
  if (!participantId) {
    return Response.json({ error: 'Scan a code first.' }, { status: 401 });
  }

  let body: { scanId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const scanId = typeof body.scanId === 'string' ? body.scanId : '';
  if (!scanId) return Response.json({ error: 'Malformed request.' }, { status: 400 });

  const result = await activateOffer(getAdminClient(), participantId, scanId);

  if ('error' in result) return Response.json(result, { status: 409 });
  return Response.json(result);
}
