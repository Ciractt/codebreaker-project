/**
 * lib/code.ts
 *
 * Server-only. Turns the safe code into the numbers a participant has earned.
 *
 * RULES THIS FILE EXISTS TO ENFORCE
 *
 *  1. The full safe code never leaves this module.
 *  2. A participant only ever receives digits for locations they have actually
 *     scanned — the check is against the `scans` table, never a client claim.
 *  3. Position information is returned ONLY for the day-one hint location.
 *  4. Non-hint digits are sorted ASCENDING BY VALUE, never by position.
 *     Returning them in position order would leak the relative ordering within
 *     each pair and cut the search space from 720 to 90.
 *
 * Anything imported into a `'use client'` component will fail the build, which
 * is intentional — this must stay server-side.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A digit the participant has earned. `position` is null unless it's a hint. */
export interface CollectedNumber {
  digit: number;
  /** 1-indexed position in the safe code. Non-null ONLY for hint digits. */
  position: number | null;
}

export interface LocationReveal {
  locationId: string;
  locationName: string;
  dayNumber: number;
  offerTitle: string;
  offerDescription: string | null;
  scannedAt: string;
  numbers: CollectedNumber[];
}

export interface ParticipantProgress {
  scannedCount: number;
  totalLocations: number;
  isComplete: boolean;
  /** Digits with a known position — the day-one hint. Ordered by position. */
  hintNumbers: CollectedNumber[];
  /** Everything else, sorted ascending by value. Order carries no information. */
  looseNumbers: number[];
  reveals: LocationReveal[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function assertValidSafeCode(code: string): void {
  if (!/^[1-9]{8}$/.test(code)) {
    throw new Error('Safe code must be exactly 8 digits, each 1-9 (no zeros).');
  }
  if (new Set(code).size !== 8) {
    throw new Error(
      'Safe code digits must all be distinct — a repeat halves the search space.',
    );
  }
}

/**
 * Combinations remaining for someone holding every digit, given how many
 * positions are revealed. Useful for admin reporting and for sanity-checking
 * a config change before it goes live.
 */
export function remainingCombinations(revealedPositions: number): number {
  const unknown = 8 - revealedPositions;
  let n = 1;
  for (let i = 2; i <= unknown; i++) n *= i;
  return n;
}

// ---------------------------------------------------------------------------
// Core allocation
// ---------------------------------------------------------------------------

interface LocationRow {
  id: string;
  location_name: string;
  day_number: number;
  offer_title: string;
  offer_description: string | null;
  digit_positions: number[];
  reveals_positions: boolean;
}

/**
 * Pull the digits a single location is responsible for.
 * Position data is attached only when the location is flagged to reveal it.
 */
function digitsForLocation(
  safeCode: string,
  location: LocationRow,
): CollectedNumber[] {
  const numbers = location.digit_positions.map((position) => ({
    digit: Number(safeCode[position - 1]),
    position: location.reveals_positions ? position : null,
  }));

  return location.reveals_positions
    ? // Hint digits: show in position order, that's the whole point of a hint.
      numbers.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : // Everything else: sort by VALUE. See rule 4 in the header.
      numbers.sort((a, b) => a.digit - b.digit);
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

/**
 * Build a participant's full progress view.
 *
 * @param supabase  A service-role client. Never pass an anon client here.
 * @param participantId
 */
export async function getParticipantProgress(
  supabase: SupabaseClient,
  participantId: string,
): Promise<ParticipantProgress> {
  const [{ data: secrets, error: secretsError }, { data: locations, error: locError }] =
    await Promise.all([
      supabase.from('campaign_secrets').select('safe_code').single(),
      supabase
        .from('locations')
        .select(
          'id, location_name, day_number, offer_title, offer_description, digit_positions, reveals_positions',
        )
        .eq('active', true)
        .order('sort_order'),
    ]);

  if (secretsError || !secrets) {
    throw new Error('Safe code is not configured. Seed campaign_secrets first.');
  }
  if (locError || !locations) {
    throw new Error('Could not load locations.');
  }

  assertValidSafeCode(secrets.safe_code);

  // Authoritative list of what this participant has actually scanned.
  const { data: scans, error: scanError } = await supabase
    .from('scans')
    .select('location_id, scanned_at')
    .eq('participant_id', participantId);

  if (scanError) throw new Error('Could not load scans.');

  const scannedAt = new Map<string, string>(
    (scans ?? []).map((s) => [s.location_id as string, s.scanned_at as string]),
  );

  const reveals: LocationReveal[] = [];
  const hintNumbers: CollectedNumber[] = [];
  const looseNumbers: number[] = [];

  for (const location of locations as LocationRow[]) {
    const when = scannedAt.get(location.id);
    if (!when) continue; // Not scanned — reveal nothing.

    const numbers = digitsForLocation(secrets.safe_code, location);

    reveals.push({
      locationId: location.id,
      locationName: location.location_name,
      dayNumber: location.day_number,
      offerTitle: location.offer_title,
      offerDescription: location.offer_description,
      scannedAt: when,
      numbers,
    });

    for (const n of numbers) {
      if (n.position !== null) hintNumbers.push(n);
      else looseNumbers.push(n.digit);
    }
  }

  hintNumbers.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  // Global ascending sort. Order must not hint at placement.
  looseNumbers.sort((a, b) => a - b);

  return {
    scannedCount: reveals.length,
    totalLocations: locations.length,
    isComplete: reveals.length === locations.length,
    hintNumbers,
    looseNumbers,
    reveals,
  };
}

// ---------------------------------------------------------------------------
// Timed release
// ---------------------------------------------------------------------------

export interface LocationAvailability {
  available: boolean;
  reason: 'ok' | 'not_yet_live' | 'expired' | 'inactive' | 'not_found';
  liveFrom?: string;
}

/**
 * Whether a QR slug can be redeemed right now. Enforced server-side — a
 * location that has leaked early must not pay out before its day.
 */
export async function checkLocationAvailability(
  supabase: SupabaseClient,
  slug: string,
): Promise<LocationAvailability & { locationId?: string }> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, active, live_from, live_until')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return { available: false, reason: 'not_found' };
  if (!data.active) return { available: false, reason: 'inactive' };

  const now = Date.now();
  const from = new Date(data.live_from).getTime();
  const until = new Date(data.live_until).getTime();

  if (now < from) {
    return { available: false, reason: 'not_yet_live', liveFrom: data.live_from };
  }
  if (now > until) {
    return { available: false, reason: 'expired' };
  }

  return { available: true, reason: 'ok', locationId: data.id };
}
