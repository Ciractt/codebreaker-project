export const metadata = { title: 'Terms | Code Breaker' };

/**
 * DRAFT. Prize promotions are covered by CAP Code section 8 — Taco Bell UK's
 * legal team should own the final wording. Placeholders are marked.
 */
export default function TermsPage() {
  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <p className="label mb-4">Terms</p>
      <h1 className="display text-[var(--step-2)] mb-6">How it works</h1>

      <div className="rounded-[var(--radius)] border border-[var(--line-strong)] p-4 mb-8">
        <p className="text-[var(--step--1)] text-[var(--ink-mute)]">
          Draft wording, pending legal review. Not final.
        </p>
      </div>

      <div className="flex flex-col gap-5 text-[var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
        <p>
          {/* TODO: confirm dates, entry ages and territory with Taco Bell UK. */}
          Four codes are hidden across Darlington over three days. Each one gives you two numbers
          and one free item. Entry is free and open to anyone who can get to the codes.
        </p>
        <p>
          The eight numbers make up the combination to a safe in the restaurant. The first code
          also tells you where its two numbers sit. Working out the rest is the game.
        </p>
        <p>
          Anyone can try the safe, whether they&rsquo;ve found the codes or not. The first person
          to open it wins free food for a year. There is one prize and it is awarded once.
        </p>
        <p>
          {/* TODO: define what "free food for a year" is in concrete terms. */}
          The prize is not transferable and there is no cash alternative.
        </p>
        <p>
          Offers are one per person per code. Once you start the timer on an offer you have ten
          minutes to claim it in the restaurant, and it can only be used once.
        </p>
      </div>
    </main>
  );
}
