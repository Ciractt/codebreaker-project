import { getAdminClient } from '@/lib/supabase/admin';
import { getCampaignState } from '@/lib/campaign';

/**
 * Two states the player side has to know about and previously didn't.
 *
 * Won: someone opened the safe. The hunt is over, but the offers are not —
 * they run until the campaign closes, so this says so rather than implying
 * everything has stopped. People who keep hunting for a prize that has gone is
 * a worse look than the leak that might have caused it.
 *
 * Closed: past the end date. Offers can no longer be claimed.
 *
 * This is the single sanctioned use of the brand yellow. It was reserved for
 * exactly this moment, which is why it means something when it appears.
 */
export default async function CampaignNotice() {
  const campaign = await getCampaignState(getAdminClient());
  if (!campaign) return null;

  // Read off the state rather than the clock: calling Date.now() during render
  // is impure, and getCampaignState already resolves this against the same
  // timestamp it used for isLive.
  const closed = campaign.isClosed;

  if (!campaign.isWon && !closed) return null;

  if (campaign.isWon) {
    return (
      <section
        className="rounded-[var(--radius-card)] p-5 mb-7"
        style={{ background: 'var(--tb-yellow)', color: 'var(--tb-black)' }}
      >
        <p
          className="label mb-2"
          style={{ color: 'rgba(0,0,0,0.62)' }}
        >
          The safe is open
        </p>
        <p className="display text-[length:var(--step-1)] mb-2">Somebody cracked it.</p>
        <p className="text-[length:var(--step--1)] leading-relaxed">
          {closed
            ? 'That’s the code broken and the free food claimed. Thanks for playing.'
            : 'Free food for a year has gone to whoever got there first. Your offers still work until the campaign closes, so go and claim them.'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-card)] p-5 mb-7" style={{ background: 'var(--card)' }}>
      <p className="label mb-2">Closed</p>
      <p className="display text-[length:var(--step-1)] mb-2">That’s a wrap.</p>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
        The hunt has finished and offers can no longer be claimed. Thanks for playing.
      </p>
    </section>
  );
}
