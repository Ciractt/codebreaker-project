import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * A flood guard, not a fraud control — and the distinction matters.
 *
 * Most customers will be on mobile data, where a whole carrier segment can sit
 * behind one address. A tight per-IP limit would lock out real people standing
 * in Darlington holding a phone, which is far worse than the abuse it would
 * prevent. So the ceiling is set where only a script reaches it.
 *
 * The genuine risk this addresses is someone with a leaked slug hammering the
 * endpoint and filling the database, not someone claiming a free taco twice.
 */

export const SCANS_PER_IP_PER_HOUR = 120;

export async function isFlooding(
  supabase: SupabaseClient,
  ip: string | null,
): Promise<boolean> {
  if (!ip) return false;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('scanned_at', since);

  // Never block on a failed check. A broken guard must not close the campaign.
  if (error) return false;

  return (count ?? 0) >= SCANS_PER_IP_PER_HOUR;
}
