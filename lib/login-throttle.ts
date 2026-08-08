import 'server-only';
import { getAdminClient } from './supabase/admin';

/**
 * Sign-in throttle.
 *
 * Supabase applies its own limits, but they are per-project and generous
 * enough that a patient attacker working through one manager's likely
 * passwords would not touch them. This counts failures per email address and
 * stops after a handful.
 *
 * Keyed on the address rather than the connection: staff will be behind one
 * store IP, and locking a whole restaurant out because someone fat-fingered
 * their password twice is worse than the attack.
 */

const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

export async function isLockedOut(identifier: string): Promise<boolean> {
  const supabase = getAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { count, error } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('succeeded', false)
    .gte('attempted_at', since);

  if (error) return false; // A broken throttle must not lock everyone out.
  return (count ?? 0) >= MAX_FAILURES;
}

export async function recordAttempt(
  identifier: string,
  ip: string | null,
  succeeded: boolean,
): Promise<void> {
  const supabase = getAdminClient();
  await supabase.from('login_attempts').insert({ identifier, ip, succeeded });
}
