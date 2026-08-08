import { notFound, redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';
import { getCampaignState } from '@/lib/campaign';
import { qrDataUri, scanUrl } from '@/lib/qr';
import LocationForm from './location-form';

export const dynamic = 'force-dynamic';

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const { id } = await params;
  const supabase = await getStaffClient();

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!location) notFound();

  const [affected, campaign] = await Promise.all([
    getImpact(supabase, id),
    getCampaignState(supabase),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const qrPreview = await qrDataUri(scanUrl(location.slug as string, siteUrl), 'purple');

  return (
    <main className="admin-shell flex-1 py-7">
      <LocationForm
        location={location}
        affected={affected}
        siteUrl={siteUrl}
        isLive={campaign?.isLive ?? false}
        qrPreview={qrPreview}
      />
    </main>
  );
}
