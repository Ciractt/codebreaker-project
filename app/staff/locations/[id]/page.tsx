import { notFound, redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getImpact } from '@/lib/admin';
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

  const affected = await getImpact(supabase, id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return (
    <main className="flex-1 px-5 py-7 mx-auto w-full max-w-md">
      <LocationForm location={location} affected={affected} siteUrl={siteUrl} />
    </main>
  );
}
