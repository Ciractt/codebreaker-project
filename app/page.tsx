import Link from 'next/link';
import PromoSlot from './components/promo-slot';

export default function HomePage() {
  return (
    <main className="flex-1 px-5 py-10 mx-auto w-full max-w-md">
      <h1 className="display text-[length:var(--step-3)] mb-4">
        Eight numbers.
        <br />
        One safe.
      </h1>

      <p className="text-[var(--ink-mute)] mb-9 max-w-[var(--measure)]">
        Four codes are hidden across Darlington over three days. Each one gives you two numbers and
        something free. Put the numbers in the right order, open the safe in store, and eat free for
        a year.
      </p>

      <ol className="list-none p-0 m-0 flex flex-col gap-5 mb-10">
        <li className="border-t border-[var(--line)] pt-4">
          <p className="label mb-1">Day one</p>
          <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">
            The first code tells you where its two numbers sit. The other three won&rsquo;t.
          </p>
        </li>
        <li className="border-t border-[var(--line)] pt-4">
          <p className="label mb-1">Days two and three</p>
          <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">
            A new code each day, and the last one waits inside the store.
          </p>
        </li>
        <li className="border-t border-[var(--line)] pt-4">
          <p className="label mb-1">The safe</p>
          <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">
            It&rsquo;s in the restaurant. Anyone can try it. Only one person opens it.
          </p>
        </li>
      </ol>

      <div className="flex gap-3">
        <Link
          href="/progress"
          className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold flex items-center justify-center"
        >
          Your numbers
        </Link>
        <Link
          href="/offers"
          className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold flex items-center justify-center"
        >
          Your offers
        </Link>
      </div>

      <PromoSlot />
    </main>
  );
}
