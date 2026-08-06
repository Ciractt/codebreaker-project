import { redirect } from 'next/navigation';
import { getStaffRole } from '@/lib/supabase/staff';
import SignOutButton from './sign-out-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff | Code Breaker' };

/**
 * Staff have no job in the redemption flow — customers activate their own
 * offers and the countdown is the proof. This page exists so sign-in has
 * somewhere to land, and is where the admin screens will go.
 */
export default async function StaffPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <p className="label mb-4">Code breaker &middot; Staff</p>
      <h1 className="display text-[var(--step-2)] mb-2">You&rsquo;re signed in</h1>
      <p className="text-[var(--ink-mute)] text-[var(--step--1)] mb-8">
        {staff.email} &middot; {staff.role === 'super_admin' ? 'Super admin' : 'Admin'}
      </p>

      <section className="border-t border-[var(--line)] pt-5 mb-8">
        <h2 className="label mb-3">Checking an offer</h2>
        <p className="text-[var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
          There&rsquo;s nothing to scan or type in. The customer taps their offer and a timer
          counts down on their phone. Check the timer is actually moving, then hand the item
          over. A screenshot won&rsquo;t count down.
        </p>
      </section>

      <SignOutButton />
    </main>
  );
}
