export default function LiveBanner({
  isLive,
  isWon,
  playersHolding,
}: {
  isLive: boolean;
  isWon: boolean;
  playersHolding: number;
}) {
  if (isWon) {
    return (
      <div
        className="relative rounded-[var(--radius)] p-4 pl-5 mb-6 overflow-hidden"
        style={{ background: 'rgba(254, 225, 1, 0.14)' }}
      >
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: 'var(--data-done)' }}
        />
        <p className="label !text-[var(--ink)] mb-1">Safe opened</p>
        <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">
          The prize has gone. Offers still work until the campaign closes.
        </p>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--line)] p-4 mb-6">
        <p className="label mb-1">Not live</p>
        <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">
          Outside the campaign window. Change anything you like.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-[var(--radius)] p-4 pl-5 mb-6 overflow-hidden"
      style={{ background: 'rgba(154, 35, 248, 0.16)' }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: 'var(--data-strong)' }}
      />
      <p className="label !text-[var(--ink)] mb-1">Live now</p>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
        {playersHolding} {playersHolding === 1 ? 'player is' : 'players are'} holding numbers.
        Day-to-day edits are fine; anything that changes the puzzle needs unlocking first.
      </p>
    </div>
  );
}
