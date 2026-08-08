import { getAdminClient } from '@/lib/supabase/admin';
import { getParticipantProgress } from '@/lib/code';
import { getOffers } from '@/lib/offers';
import { readSession } from '@/lib/session';
import CodeStrip from '@/app/components/code-strip';
import BottomNav from '@/app/components/bottom-nav';
import EmptyState from '@/app/components/empty-state';
import PromoSlot from '@/app/components/promo-slot';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const participantId = await readSession();

  if (!participantId) {
    return (
      <EmptyState
        eyebrow="Your numbers"
        heading="Nothing yet"
        body="Find one of the four codes around Darlington to start."
      />
    );
  }

  const supabase = getAdminClient();
  const [progress, offers] = await Promise.all([
    getParticipantProgress(supabase, participantId),
    getOffers(supabase, participantId),
  ]);

  return (
    <>
      <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
        <p className="label mb-4">Your numbers</p>
        <CodeStrip progress={progress} />
        <PromoSlot />
      </main>
      <BottomNav unusedOffers={offers.filter((offer) => !offer.redeemedAt).length} />
    </>
  );
}
