import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { getDailyScans, getFunnel, getLocationsReport, getOverview } from '@/lib/admin';
import { getCampaignState, getRecentActivity } from '@/lib/campaign';
import LiveBanner from './live-banner';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Stats | Code Breaker' };

const ACTIONS: Record<string, string> = {
  'location.update': 'Code edited',
  'location.insert': 'Code added',
  'location.delete': 'Code removed',
  'campaign.update': 'Campaign settings changed',
  'safe_code.rotated': 'Safe code rotated',
  'staff.insert': 'Team member added',
  'staff.update': 'Team member rank changed',
  'staff.delete': 'Team member removed',
};

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] p-4">
      <p className="display text-[length:var(--step-2)] leading-none mb-2 tabular-nums">{value}</p>
      <p className="label !text-[var(--ink-dim)]">{label}</p>
    </div>
  );
}

export default async function StaffStatsPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');

  const supabase = await getStaffClient();
  const [overview, funnel, locations, daily, campaign, activity] = await Promise.all([
    getOverview(supabase),
    getFunnel(supabase),
    getLocationsReport(supabase),
    getDailyScans(supabase),
    getCampaignState(supabase),
    getRecentActivity(supabase, 12),
  ]);

  const peak = Math.max(1, ...daily.map((d) => d.scans));
  const totalPlayers = overview?.total_players ?? 0;

  return (
    <main className="admin-shell flex-1 py-7">
      <h1 className="display text-[length:var(--step-2)] mb-5">How it&rsquo;s going</h1>

      <LiveBanner
        isLive={campaign?.isLive ?? false}
        isWon={campaign?.isWon ?? false}
        playersHolding={overview?.total_players ?? 0}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Stat value={totalPlayers} label="Players" />
        <Stat value={overview?.active_players_24h ?? 0} label="Active today" />
        <Stat value={overview?.total_scans ?? 0} label="Codes scanned" />
        <Stat value={overview?.completed_all ?? 0} label="Found all four" />
        <Stat value={overview?.offers_activated ?? 0} label="Offers used" />
        <Stat value={overview?.offers_outstanding ?? 0} label="Offers waiting" />
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-10 md:items-start">
      <section className="mb-8">
        <h2 className="label mb-3">How far people get</h2>
        {funnel.length === 0 ? (
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">No scans yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {funnel.map((row) => (
              <li key={row.codes_found} className="flex items-center gap-3">
                <span className="label w-20 shrink-0">
                  {row.codes_found} {row.codes_found === 1 ? 'code' : 'codes'}
                </span>
                <span
                  className="h-6 rounded-sm bg-[var(--tb-white)] min-w-[3px]"
                  style={{ width: `${(row.players / Math.max(1, totalPlayers)) * 100}%` }}
                />
                <span className="text-[length:var(--step--1)] text-[var(--ink-mute)] tabular-nums">
                  {row.players}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="label mb-3">By code</h2>
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {locations.map((location) => (
            <li
              key={location.location_id}
              className="rounded-[var(--radius)] border border-[var(--line)] p-4"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="label">Day {location.day_number}</p>
                {!location.active && (
                  <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">Off</p>
                )}
              </div>
              <p className="mb-2">{location.location_name}</p>
              <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] tabular-nums">
                {location.scan_count} scanned &middot; {location.activated_count} offers used
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="label mb-3">Scans by day</h2>
        {daily.length === 0 ? (
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">Nothing yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex items-end gap-2 h-32">
            {daily.map((row) => (
              <li key={row.day} className="flex-1 flex flex-col items-center gap-2">
                <span
                  className="w-full rounded-t-sm bg-[var(--tb-white)] min-h-[2px]"
                  style={{ height: `${(row.scans / peak) * 100}%` }}
                  title={`${row.scans} scans`}
                />
                <span className="text-[length:var(--step--1)] text-[var(--ink-dim)] tabular-nums">
                  {new Date(row.day).getDate()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="label mb-3">What&rsquo;s been changed</h2>
        {activity.length === 0 ? (
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">Nothing yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between gap-3 text-[length:var(--step--1)]"
              >
                <span className="text-[var(--ink-mute)]">
                  {ACTIONS[entry.action] ?? entry.action}
                  {typeof entry.detail?.location_name === 'string' && (
                    <span className="text-[var(--ink-dim)]">
                      {' '}
                      &mdash; {entry.detail.location_name as string}
                    </span>
                  )}
                </span>
                <span className="text-[var(--ink-dim)] whitespace-nowrap tabular-nums">
                  {new Date(entry.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </main>
  );
}
