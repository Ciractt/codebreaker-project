import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';
import { getCampaignState } from '@/lib/campaign';
import CampaignForm from './campaign-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign | Code Breaker' };

export default async function CampaignPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();

  const [{ data: settings }, { data: secrets }, affected, campaign] = await Promise.all([
    supabase.from('campaign_settings').select('*').maybeSingle(),
    supabase.from('campaign_secrets').select('safe_code, rotated_at').maybeSingle(),
    getImpact(supabase),
    getCampaignState(supabase),
  ]);

  return (
    <main className="admin-shell flex-1 py-7">
      <CampaignForm
        settings={settings}
        safeCode={secrets?.safe_code ?? null}
        rotatedAt={secrets?.rotated_at ?? null}
        affected={affected}
        isLive={campaign?.isLive ?? false}
      />
    </main>
  );
}
