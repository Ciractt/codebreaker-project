/**
 * Small chart primitives for the admin. Plain markup, no library — these are
 * bars and the data is tiny.
 *
 * The bars sit inside a track with an explicit height. A percentage height
 * inside an auto-height parent resolves to zero, which is how the first
 * version of the daily chart ended up as a flat line.
 */

export function StatCard({
  value,
  label,
  accent = 'violet',
}: {
  value: number | string;
  label: string;
  accent?: 'violet' | 'done' | 'plain';
}) {
  const bar =
    accent === 'done'
      ? 'var(--data-done)'
      : accent === 'violet'
        ? 'var(--data-strong)'
        : 'var(--line)';

  return (
    <div
      className="relative rounded-[var(--radius)] p-4 pl-5 overflow-hidden"
      style={{ background: 'var(--card)' }}
    >
      <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1" style={{ background: bar }} />
      <p className="display text-[length:var(--step-2)] leading-none mb-2 tabular-nums">{value}</p>
      <p className="label !text-[var(--ink-dim)]">{label}</p>
    </div>
  );
}

export function ColumnChart({
  data,
  height = 160,
  emptyLabel = 'Nothing yet.',
}: {
  /** `id` is the React key. `label` is what's printed and may be blank — the
   *  hourly chart only labels every third column, so labels are not unique. */
  data: { id: string; label: string; value: number; accent?: string }[];
  height?: number;
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return <p className="text-[length:var(--step--1)] text-[var(--ink-dim)]">{emptyLabel}</p>;
  }

  const peak = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="list-none p-0 m-0 flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => (
        <li key={d.id} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
          <span className="text-[length:var(--step--1)] text-[var(--ink-dim)] tabular-nums leading-none">
            {d.value > 0 ? d.value : ''}
          </span>
          <span
            className="w-full rounded-t-[3px]"
            style={{
              height: `${(d.value / peak) * 100}%`,
              minHeight: d.value > 0 ? 3 : 2,
              background: d.value > 0 ? (d.accent ?? 'var(--data-strong)') : 'var(--data-track)',
            }}
            title={`${d.id}: ${d.value}`}
          />
          <span className="text-[length:var(--step--1)] text-[var(--ink-dim)] tabular-nums leading-none">
            {d.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BarRow({
  label,
  value,
  total,
  accent = 'var(--data-strong)',
  suffix,
}: {
  label: string;
  value: number;
  total: number;
  accent?: string;
  suffix?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <li className="flex items-center gap-3">
      <span className="label w-24 shrink-0 truncate">{label}</span>
      <span
        className="flex-1 h-7 rounded-[4px] overflow-hidden"
        style={{ background: 'var(--data-track)' }}
      >
        <span
          className="block h-full rounded-[4px]"
          style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%`, background: accent }}
        />
      </span>
      <span className="text-[length:var(--step--1)] text-[var(--ink-mute)] tabular-nums w-16 text-right shrink-0">
        {value}
        {suffix ?? ''}
      </span>
    </li>
  );
}
