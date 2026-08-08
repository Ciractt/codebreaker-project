import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Codes | Code Breaker' };

export default async function LocationsPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();
  const { data: locations } = await supabase
    .from('locations')
    .select(
      'id, day_number, sort_order, location_name, offer_title, slug, digit_positions, reveals_positions, active, live_from, live_until',
    )
    .order('sort_order');

  return (
    <main className="flex-1 px-5 py-7 mx-auto w-full max-w-md">
      <h1 className="display text-[var(--step-2)] mb-2">The four codes</h1>
      <p className="text-[var(--step--1)] text-[var(--ink-mute)] mb-7">
        Between them they cover all eight positions. Only the first one tells players where its
        numbers sit.
      </p>

      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {(locations ?? []).map((location) => (
          <li key={location.id}>
            <Link
              href={`/staff/locations/${location.id}`}
              className="block rounded-[var(--radius)] border border-[var(--line)] p-4"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="label">Day {location.day_number}</p>
                <p className="text-[var(--step--1)] text-[var(--ink-dim)] tabular-nums">
                  Positions {(location.digit_positions as number[]).join(' & ')}
                  {location.reveals_positions ? ' · shown' : ''}
                </p>
              </div>
              <p className="mb-1">{location.location_name}</p>
              <p className="text-[var(--step--1)] text-[var(--ink-mute)]">
                {location.offer_title}
                {!location.active && ' · switched off'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
