import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Loose shape check only. Email is unverified by design. */
export function normaliseEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

export async function findOrCreateParticipant(
  supabase: SupabaseClient,
  email: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('participants')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing.id as string;
  }

  const { data: created, error } = await supabase
    .from('participants')
    .insert({ email })
    .select('id')
    .single();

  if (error || !created) {
    // Someone else inserted between the select and the insert.
    const { data: raced } = await supabase
      .from('participants')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (raced) return raced.id as string;
    throw new Error('Could not create participant.');
  }

  return created.id as string;
}

function redemptionCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Records the scan and opens the offer. Idempotent — scanning the same QR
 * twice returns the original scan rather than issuing a second offer.
 */
export async function recordScan(
  supabase: SupabaseClient,
  participantId: string,
  locationId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<{ scanId: string; alreadyScanned: boolean }> {
  const { data: existing } = await supabase
    .from('scans')
    .select('id')
    .eq('participant_id', participantId)
    .eq('location_id', locationId)
    .maybeSingle();

  if (existing) return { scanId: existing.id as string, alreadyScanned: true };

  const { data: scan, error } = await supabase
    .from('scans')
    .insert({
      participant_id: participantId,
      location_id: locationId,
      ip_address: ip,
      user_agent: userAgent?.slice(0, 500) ?? null,
    })
    .select('id')
    .single();

  if (error || !scan) {
    const { data: raced } = await supabase
      .from('scans')
      .select('id')
      .eq('participant_id', participantId)
      .eq('location_id', locationId)
      .maybeSingle();
    if (raced) return { scanId: raced.id as string, alreadyScanned: true };
    throw new Error('Could not record scan.');
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: redemptionError } = await supabase
      .from('redemptions')
      .insert({ scan_id: scan.id, redemption_code: redemptionCode() });
    if (!redemptionError) break;
    if (attempt === 4) throw new Error('Could not issue a redemption code.');
  }

  return { scanId: scan.id as string, alreadyScanned: false };
}
