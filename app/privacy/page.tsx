export const metadata = { title: 'Privacy | Code Breaker' };

/**
 * DRAFT. Everything below needs QFM sign-off before launch — in particular the
 * named controller, the lawful basis, the retention period, and the contact
 * address. Do not treat this as approved copy.
 */
export default function PrivacyPage() {
  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <p className="label mb-4">Privacy</p>
      <h1 className="display text-[var(--step-2)] mb-6">What we do with your email</h1>

      <div className="rounded-[var(--radius)] border border-[var(--line-strong)] p-4 mb-8">
        <p className="text-[var(--step--1)] text-[var(--ink-mute)]">
          Draft wording, pending legal review. Not final.
        </p>
      </div>

      <div className="flex flex-col gap-5 text-[var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
        <p>
          Your email address is the only personal detail we ask for. We use it to remember which
          codes you&rsquo;ve found and which offers are still yours to claim, so you can pick up
          where you left off on another day or another device.
        </p>
        <p>
          We don&rsquo;t send you marketing. We don&rsquo;t send you anything at all &mdash; there
          is no confirmation email and no newsletter. We don&rsquo;t sell or share your address,
          and we don&rsquo;t pass it to anyone outside the campaign.
        </p>
        <p>
          We also record when you scan a code and the network address you scanned from. That is
          only used to spot people trying to claim offers they haven&rsquo;t earned.
        </p>
        <p>
          {/* TODO: confirm the retention period with QFM. */}
          Everything is deleted after the campaign closes. Data is stored in the UK.
        </p>
        <p>
          {/* TODO: confirm controller name, postal address and contact route. */}
          The controller is QFM Group. To ask what we hold about you, or to have it removed, get
          in touch and we&rsquo;ll sort it.
        </p>
      </div>
    </main>
  );
}
