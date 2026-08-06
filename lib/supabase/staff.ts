import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Staff client. Runs as the signed-in staff member, so every query is subject
 * to the RLS policies in migration 0001 — an `admin` genuinely cannot read
 * participant emails, rather than being trusted not to.
 */
export async function getStaffClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Called from a Server Component; the proxy refreshes instead.
          }
        },
      },
    },
  );
}

export type StaffRole = 'admin' | 'super_admin';

export async function getStaffRole(): Promise<{ email: string; role: StaffRole } | null> {
  const supabase = await getStaffClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;

  return { email: user.email ?? '', role: data.role as StaffRole };
}
