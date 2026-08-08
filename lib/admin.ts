import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Overview {
  total_players: number;
  active_players_24h: number;
  total_scans: number;
  scans_24h: number;
  completed_all: number;
  offers_activated: number;
  offers_outstanding: number;
}

export interface LocationReport {
  location_id: string;
  day_number: number;
  sort_order: number;
  location_name: string;
  offer_title: string;
  active: boolean;
  live_from: string;
  live_until: string;
  scan_count: number;
  activated_count: number;
  first_scan: string | null;
  last_scan: string | null;
}

export async function getOverview(supabase: SupabaseClient): Promise<Overview | null> {
  const { data } = await supabase.rpc('admin_overview');
  return data?.[0] ?? null;
}

export async function getFunnel(
  supabase: SupabaseClient,
): Promise<{ codes_found: number; players: number }[]> {
  const { data } = await supabase.rpc('admin_funnel');
  return data ?? [];
}

export async function getLocationsReport(
  supabase: SupabaseClient,
): Promise<LocationReport[]> {
  const { data } = await supabase.rpc('admin_locations_report');
  return data ?? [];
}

export async function getDailyScans(
  supabase: SupabaseClient,
): Promise<{ day: string; scans: number; players: number }[]> {
  const { data } = await supabase.rpc('admin_daily_scans');
  return data ?? [];
}

/** How many players already hold numbers from this location (or overall). */
export async function getImpact(
  supabase: SupabaseClient,
  locationId?: string,
): Promise<number> {
  const { data } = await supabase.rpc('admin_impact', {
    p_location_id: locationId ?? null,
  });
  return data?.[0]?.affected_players ?? 0;
}

export async function getHourlyScans(
  supabase: SupabaseClient,
): Promise<{ hour: number; scans: number }[]> {
  const { data } = await supabase.rpc('admin_hourly_scans');
  return data ?? [];
}

export interface Takeup {
  location_id: string;
  day_number: number;
  location_name: string;
  offer_title: string;
  scans: number;
  claimed: number;
}

export async function getOfferTakeup(supabase: SupabaseClient): Promise<Takeup[]> {
  const { data } = await supabase.rpc('admin_offer_takeup');
  return data ?? [];
}

export interface TeamMember {
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  display_name: string | null;
  store: string | null;
  created_at: string;
  last_sign_in: string | null;
}

export async function getTeam(supabase: SupabaseClient): Promise<TeamMember[]> {
  const { data } = await supabase.rpc('admin_team');
  return data ?? [];
}
