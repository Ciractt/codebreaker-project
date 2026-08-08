import { getAdminClient } from '@/lib/supabase/admin';
import { getOffers } from '@/lib/offers';
import { readSession } from '@/lib/session';
import OfferCard from '@/app/components/offer-card';
import BottomNav from '@/app/components/bottom-nav';
import EmptyState from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const participantId = await readSession();

  if (!participantId) {
    return (
      <EmptyState
        eyebrow="Your offers"
        heading="Nothing here yet"
        body="Find one of the four codes around Darlington and your free food lands here."
      />
    );
  }

  const offers = await getOffers(getAdminClient(), participantId);
  const unused = offers.filter((offer) => !offer.redeemedAt).length;

  return (
    <>
      <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
        <p className="label mb-4">Your offers</p>
        <h1 className="display text-[length:var(--step-2)] mb-2">
          {offers.length === 1 ? 'One thing' : `${offers.length} things`} to claim
        </h1>
        <p className="text-[var(--ink-mute)] text-[length:var(--step--1)] mb-7">
          Start one at the counter, not before. Ten minutes each, one use only.
        </p>

        <ul className="list-none p-0 m-0 flex flex-col gap-5">
          {offers.map((offer) => (
            <li key={offer.scanId}>
              <OfferCard offer={offer} />
            </li>
          ))}
        </ul>
      </main>
      <BottomNav unusedOffers={unused} />
    </>
  );
}
