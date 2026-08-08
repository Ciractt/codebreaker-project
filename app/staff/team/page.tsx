import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import TeamList from './team-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team | Code Breaker' };

export default async function TeamPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();
  const { data: team } = await supabase
    .from('staff')
    .select('user_id, role, display_name, store, created_at')
    .order('created_at');

  return (
    <main className="flex-1 px-5 py-7 mx-auto w-full max-w-md">
      <h1 className="display text-[length:var(--step-2)] mb-2">Team</h1>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-7 leading-relaxed">
        Admins see the stats. Super admins can change the codes, the campaign and the safe code,
        and can see player emails.
      </p>

      <TeamList team={team ?? []} />

      <section className="mt-10 pt-6 border-t border-[var(--line)]">
        <h2 className="label mb-3">Adding someone</h2>
        <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
          There&rsquo;s no self-signup, so new accounts are created in Supabase under
          Authentication, then given a rank here. This is the one thing that still needs the
          dashboard.
        </p>
      </section>
    </main>
  );
}
