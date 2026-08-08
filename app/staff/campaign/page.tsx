import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';
import CampaignForm from './campaign-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign | Code Breaker' };

export default async function CampaignPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();

  const [{ data: settings }, { data: secrets }, affected] = await Promise.all([
    supabase.from('campaign_settings').select('*').maybeSingle(),
    supabase.from('campaign_secrets').select('safe_code, rotated_at').maybeSingle(),
    getImpact(supabase),
  ]);

  return (
    <main className="flex-1 px-5 py-7 mx-auto w-full max-w-md">
      <CampaignForm
        settings={settings}
        safeCode={secrets?.safe_code ?? null}
        rotatedAt={secrets?.rotated_at ?? null}
        affected={affected}
      />
    </main>
  );
}
