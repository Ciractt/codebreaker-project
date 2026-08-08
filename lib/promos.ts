import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Promo {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  sortOrder: number;
}

export async function getActivePromo(supabase: SupabaseClient): Promise<Promo | null> {
  const { data } = await supabase
    .from('promos')
    .select('id, title, image_url, link_url, active, sort_order')
    .eq('active', true)
    .order('sort_order')
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    imageUrl: data.image_url as string,
    linkUrl: (data.link_url as string | null) ?? null,
    active: data.active as boolean,
    sortOrder: data.sort_order as number,
  };
}

export async function getAllPromos(supabase: SupabaseClient): Promise<Promo[]> {
  const { data } = await supabase
    .from('promos')
    .select('id, title, image_url, link_url, active, sort_order')
    .order('sort_order');

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    imageUrl: row.image_url as string,
    linkUrl: (row.link_url as string | null) ?? null,
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
  }));
}
