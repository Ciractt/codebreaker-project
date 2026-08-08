import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getTeam } from '@/lib/admin';
import TeamList from './team-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team | Code Breaker' };

export default async function TeamPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');

  const supabase = await getStaffClient();
  const team = await getTeam(supabase);

  return (
    <main className="admin-shell flex-1 py-7">
      <h1 className="display text-[length:var(--step-2)] mb-2">Team</h1>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-7 leading-relaxed max-w-[60ch]">
        Admins see the stats and the QR codes. Super admins can also change the codes, the
        campaign and the safe code, and can see player emails. Everyone can see this list &mdash;
        an account nobody recognises should be obvious to more than one person.
      </p>

      <TeamList team={team} viewerRole={staff.role} viewerEmail={staff.email} />
    </main>
  );
}
