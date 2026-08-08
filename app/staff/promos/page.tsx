import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getAllPromos } from '@/lib/promos';
import PromoManager from './promo-manager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Promo | Code Breaker' };

export default async function PromosPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();
  const promos = await getAllPromos(supabase);

  return (
    <main className="flex-1 px-5 py-7 mx-auto w-full max-w-md">
      <h1 className="display text-[length:var(--step-2)] mb-2">Promo banner</h1>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-7 leading-relaxed">
        Shows beneath the content on the player pages. The first active one is used, so switching
        banners is a matter of turning one off and another on.
      </p>

      <PromoManager promos={promos} />
    </main>
  );
}
