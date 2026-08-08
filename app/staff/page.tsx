import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import {
  getDailyScans,
  getFunnel,
  getHourlyScans,
  getOfferTakeup,
  getOverview,
} from '@/lib/admin';
import { getCampaignState, getRecentActivity } from '@/lib/campaign';
import LiveBanner from './live-banner';
import { BarRow, ColumnChart, StatCard } from './components/charts';

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
  'promo.insert': 'Banner added',
  'promo.update': 'Banner changed',
  'promo.delete': 'Banner removed',
};

/** Deeper violet the further someone gets; yellow once they hold all four. */
function depthColour(found: number, total: number): string {
  if (found >= total) return 'var(--data-done)';
  if (found >= total - 1) return 'var(--data-strong)';
  if (found >= 2) return 'var(--data-mid)';
  return 'var(--data-soft)';
}

export default async function StaffStatsPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');

  const supabase = await getStaffClient();
  const [overview, funnel, daily, hourly, takeup, campaign, activity] = await Promise.all([
    getOverview(supabase),
    getFunnel(supabase),
    getDailyScans(supabase),
    getHourlyScans(supabase),
    getOfferTakeup(supabase),
    getCampaignState(supabase),
    getRecentActivity(supabase, 12),
  ]);

  const players = overview?.total_players ?? 0;
  const totalCodes = takeup.length || 4;

  const hourMap = new Map(hourly.map((h) => [h.hour, h.scans]));
  const openHours = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00–23:00

  const dailyData = daily.map((d) => ({
    id: d.day,
    label: new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: d.scans,
  }));

  const hourlyData = openHours.map((hour) => ({
    id: `h${hour}`,
    label: hour % 3 === 0 ? `${hour}:00` : '',
    value: hourMap.get(hour) ?? 0,
  }));

  const claimRate =
    overview && overview.total_scans > 0
      ? Math.round((overview.offers_activated / overview.total_scans) * 100)
      : 0;

  return (
    <main className="admin-shell flex-1 py-7">
      <h1 className="display text-[length:var(--step-2)] mb-5">How it&rsquo;s going</h1>

      <LiveBanner
        isLive={campaign?.isLive ?? false}
        isWon={campaign?.isWon ?? false}
        playersHolding={players}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        <StatCard value={players} label="Players" />
        <StatCard value={overview?.active_players_24h ?? 0} label="Active today" />
        <StatCard value={overview?.total_scans ?? 0} label="Codes scanned" />
        <StatCard value={overview?.completed_all ?? 0} label="Found all four" accent="done" />
        <StatCard value={overview?.offers_activated ?? 0} label="Offers used" />
        <StatCard value={`${claimRate}%`} label="Claim rate" accent="plain" />
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-10 md:items-start">
        <section className="mb-10">
          <h2 className="label mb-1">How far people get</h2>
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-4">
            Yellow is everyone holding the full set.
          </p>
          {funnel.length === 0 ? (
            <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">No scans yet.</p>
          ) : (
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {funnel.map((row) => (
                <BarRow
                  key={row.codes_found}
                  label={`${row.codes_found} of ${totalCodes}`}
                  value={row.players}
                  total={players}
                  accent={depthColour(row.codes_found, totalCodes)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="mb-10">
          <h2 className="label mb-1">Offer take-up</h2>
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-4">
            Claimed against scanned. Plenty of scans and few claims means the code is somewhere
            people aren&rsquo;t heading to the restaurant from.
          </p>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {takeup.map((row) => (
              <BarRow
                key={row.location_id}
                label={`Day ${row.day_number}`}
                value={row.claimed}
                total={Math.max(row.scans, 1)}
                accent="var(--data-mid)"
                suffix={` / ${row.scans}`}
              />
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="label mb-1">Scans by day</h2>
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-4">
            Every scan, not unique players.
          </p>
          <ColumnChart data={dailyData} />
        </section>

        <section className="mb-10">
          <h2 className="label mb-1">Scans by hour</h2>
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-4">
            Europe/London, 7am to 11pm. Use it to decide who&rsquo;s on.
          </p>
          <ColumnChart data={hourlyData} height={140} />
        </section>
      </div>

      <section className="mb-10">
        <h2 className="label mb-4">By code</h2>
        <ul className="list-none p-0 m-0 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {takeup.map((row) => (
            <li
              key={row.location_id}
              className="rounded-[var(--radius)] p-4"
              style={{ background: 'var(--card)' }}
            >
              <p className="label !text-[var(--ink-dim)] mb-1">Day {row.day_number}</p>
              <p className="mb-1">{row.location_name}</p>
              <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-3">
                {row.offer_title}
              </p>
              <p className="display text-[length:var(--step-1)] tabular-nums">
                {row.scans}
                <span className="text-[length:var(--step--1)] text-[var(--ink-dim)]"> scanned</span>
              </p>
              <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] tabular-nums">
                {row.claimed} claimed
                {row.scans > 0 && ` · ${Math.round((row.claimed / row.scans) * 100)}%`}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="label mb-4">What&rsquo;s been changed</h2>
        {activity.length === 0 ? (
          <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">Nothing yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between gap-4 py-2 border-b border-[var(--line)] text-[length:var(--step--1)]"
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
    </main>
  );
}
