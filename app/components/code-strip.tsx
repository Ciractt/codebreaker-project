export interface Progress {
  scannedCount: number;
  totalLocations: number;
  isComplete: boolean;
  hintNumbers: { digit: number; position: number | null }[];
  looseNumbers: number[];
  reveals: {
    locationId: string;
    locationName: string;
    dayNumber: number;
    offerTitle: string;
    offerDescription: string | null;
    scannedAt: string;
    numbers: { digit: number; position: number | null }[];
  }[];
}

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const WORDS = ['None', 'One', 'Two', 'Three', 'Four'];

export default function CodeStrip({ progress }: { progress: Progress }) {
  const placed = new Map(
    progress.hintNumbers
      .filter((n) => n.position !== null)
      .map((n) => [n.position as number, n.digit]),
  );

  const latest = progress.reveals[progress.reveals.length - 1];

  return (
    <div>
      <p className="label mb-4">Code breaker &middot; Darlington</p>

      <h1 className="display text-[var(--step-2)] mb-1">
        {WORDS[progress.scannedCount] ?? progress.scannedCount} of {progress.totalLocations} found
      </h1>
      <p className="text-[var(--ink-mute)] text-[var(--step--1)] mb-7">
        {progress.isComplete
          ? 'That\u2019s all of them. The safe is in store.'
          : `${progress.totalLocations - progress.scannedCount} to go.`}
      </p>

      <ul className="grid grid-cols-8 gap-[5px] mb-2 list-none p-0 m-0">
        {SLOTS.map((slot) => {
          const digit = placed.get(slot);
          return (
            <li
              key={slot}
              className={
                digit === undefined
                  ? 'aspect-[3/4] rounded-[var(--radius-slot)] border border-dashed border-[var(--slot-empty-border)] bg-[var(--slot-empty-bg)]'
                  : 'aspect-[3/4] rounded-[var(--radius-slot)] bg-[var(--tb-violet)] flex items-center justify-center display text-[var(--step-1)]'
              }
            >
              {digit === undefined ? (
                <span className="sr-only">Position {slot}, unknown</span>
              ) : (
                digit
              )}
            </li>
          );
        })}
      </ul>

      <ul className="grid grid-cols-8 gap-[5px] mb-8 list-none p-0 m-0" aria-hidden="true">
        {SLOTS.map((slot) => (
          <li
            key={slot}
            className={`text-center text-[var(--step--1)] ${
              placed.has(slot) ? 'text-[var(--tb-violet)]' : 'text-[var(--ink-dim)]'
            }`}
          >
            {slot}
          </li>
        ))}
      </ul>

      {progress.looseNumbers.length > 0 && (
        <section className="border-t border-[var(--line)] pt-5 mb-8">
          <h2 className="label mb-3">Your other numbers</h2>
          <ul className="flex gap-2 mb-3 list-none p-0 m-0">
            {progress.looseNumbers.map((digit, index) => (
              <li
                key={`${digit}-${index}`}
                className="flex-1 aspect-square rounded-[var(--radius)] border border-[var(--slot-loose-border)] flex items-center justify-center display text-[var(--step-1)]"
              >
                {digit}
              </li>
            ))}
          </ul>
          <p className="text-[var(--step--1)] text-[var(--ink-mute)]">
            Where these go is yours to work out.
          </p>
        </section>
      )}

      {latest && (
        <section className="border-t border-[var(--line)] pt-5">
          <h2 className="label mb-2">Yours to claim</h2>
          <p className="display text-[var(--step-1)] mb-1">{latest.offerTitle}</p>
          {latest.offerDescription && (
            <p className="text-[var(--step--1)] text-[var(--ink-mute)]">
              {latest.offerDescription}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
