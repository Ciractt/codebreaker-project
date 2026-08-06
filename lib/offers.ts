import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * How long the offer stays on screen once the customer activates it.
 *
 * There is no staff confirmation step — a new store opening is too busy for a
 * two-sided flow. Activation IS redemption: one tap, one use, then it is gone
 * whether or not they reached the till. The live countdown is what staff check,
 * because a screenshot does not tick.
 */
export const REDEMPTION_WINDOW_MINUTES = 10;

export interface Offer {
  scanId: string;
  redemptionCode: string;
  offerTitle: string;
  offerDescription: string | null;
  locationName: string;
  dayNumber: number;
  startedAt: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
}

export async function getOffers(
  supabase: SupabaseClient,
  participantId: string,
): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('scans')
    .select(
      'id, location_id, locations(offer_title, offer_description, location_name, day_number, sort_order), redemptions(redemption_code, started_at, expires_at, redeemed_at)',
    )
    .eq('participant_id', participantId);

  if (error || !data) return [];

  return data
    .map((row) => {
      const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;
      const redemption = Array.isArray(row.redemptions) ? row.redemptions[0] : row.redemptions;
      if (!location || !redemption) return null;

      return {
        scanId: row.id as string,
        redemptionCode: redemption.redemption_code as string,
        offerTitle: location.offer_title as string,
        offerDescription: (location.offer_description as string | null) ?? null,
        locationName: location.location_name as string,
        dayNumber: location.day_number as number,
        startedAt: (redemption.started_at as string | null) ?? null,
        expiresAt: (redemption.expires_at as string | null) ?? null,
        redeemedAt: (redemption.redeemed_at as string | null) ?? null,
      } satisfies Offer;
    })
    .filter((offer): offer is Offer => offer !== null)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

/**
 * Activates an offer: starts the countdown and burns it in the same move.
 *
 * Returns the existing window if it is still running, so a refresh or a double
 * tap does not buy another ten minutes. Once the window closes the offer is
 * spent — it cannot be reactivated, which is what stops one offer being shown
 * at two tills.
 */
export async function activateOffer(
  supabase: SupabaseClient,
  participantId: string,
  scanId: string,
): Promise<{ code: string; expiresAt: string } | { error: string }> {
  const { data: scan } = await supabase
    .from('scans')
    .select('id')
    .eq('id', scanId)
    .eq('participant_id', participantId)
    .maybeSingle();

  if (!scan) return { error: 'That offer isn\u2019t yours.' };

  const { data: redemption } = await supabase
    .from('redemptions')
    .select('redemption_code, started_at, expires_at, redeemed_at')
    .eq('scan_id', scanId)
    .maybeSingle();

  if (!redemption) return { error: 'That offer isn\u2019t ready yet.' };

  const now = Date.now();

  if (redemption.expires_at) {
    const stillRunning = new Date(redemption.expires_at).getTime() > now;
    if (stillRunning) {
      return {
        code: redemption.redemption_code as string,
        expiresAt: redemption.expires_at as string,
      };
    }
    return { error: 'That one has been used.' };
  }

  const startedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + REDEMPTION_WINDOW_MINUTES * 60_000).toISOString();

  // redeemed_at is set here, not by a staff member later. Activation is the
  // redemption; the row records that the customer spent it.
  const { error } = await supabase
    .from('redemptions')
    .update({ started_at: startedAt, expires_at: expiresAt, redeemed_at: startedAt })
    .eq('scan_id', scanId)
    .is('expires_at', null);

  if (error) return { error: 'Could not open that offer. Try again.' };

  return { code: redemption.redemption_code as string, expiresAt };
}
