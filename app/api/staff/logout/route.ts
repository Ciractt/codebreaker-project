import { getStaffClient } from '@/lib/supabase/staff';

export async function POST() {
  const supabase = await getStaffClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
