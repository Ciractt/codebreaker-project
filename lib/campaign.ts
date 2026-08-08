import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CampaignState {
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  isLive: boolean;
  isClosed: boolean;
  isWon: boolean;
}

/**
 * Live means the clock says so, not a flag someone remembered to set. The
 * admin uses this to decide how much friction to put in front of structural
 * changes — the ones that invalidate numbers people already hold.
 */
export async function getCampaignState(
  supabase: SupabaseClient,
): Promise<CampaignState | null> {
  const { data } = await supabase
    .from('campaign_settings')
    .select('campaign_name, starts_at, ends_at, is_won')
    .maybeSingle();

  if (!data) return null;

  const now = Date.now();
  const starts = data.starts_at ? new Date(data.starts_at).getTime() : null;
  const ends = data.ends_at ? new Date(data.ends_at).getTime() : null;

  return {
    name: data.campaign_name as string,
    startsAt: data.starts_at as string | null,
    endsAt: data.ends_at as string | null,
    isLive: starts !== null && ends !== null && now >= starts && now <= ends,
    isClosed: ends !== null && now > ends,
    isWon: Boolean(data.is_won),
  };
}

export async function getRecentActivity(
  supabase: SupabaseClient,
  limit = 20,
): Promise<{ id: number; action: string; detail: Record<string, unknown>; created_at: string }[]> {
  const { data } = await supabase.rpc('admin_recent_activity', { p_limit: limit });
  return data ?? [];
}
