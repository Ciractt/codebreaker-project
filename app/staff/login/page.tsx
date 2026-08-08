import { redirect } from 'next/navigation';
import { getStaffRole } from '@/lib/supabase/staff';
import StaffLoginForm from './login-form';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Staff sign in | Code Breaker' };

export default async function StaffLoginPage() {
  // Signed in already — send them where they were going.
  if (await getStaffRole()) redirect('/staff');

  return (
    <main className="flex-1 px-5 py-10 md:py-20 mx-auto w-full max-w-sm">
      <p className="label mb-4">Code breaker &middot; Staff</p>
      <h1 className="display text-[length:var(--step-2)] mb-6">Sign in</h1>
      <StaffLoginForm />
    </main>
  );
}
