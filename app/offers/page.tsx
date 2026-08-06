import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOffers } from '@/lib/offers';
import { readSession } from '@/lib/session';
import OfferCard from '@/app/components/offer-card';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const participantId = await readSession();

  if (!participantId) {
    return (
      <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
        <p className="label mb-4">Your offers</p>
        <h1 className="display text-[var(--step-2)] mb-3">Nothing here yet</h1>
        <p className="text-[var(--ink-mute)]">
          Scan one of the four codes around Darlington and your free food lands here.
        </p>
      </main>
    );
  }

  const offers = await getOffers(getAdminClient(), participantId);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <p className="label mb-4">Your offers</p>
      <h1 className="display text-[var(--step-2)] mb-2">
        {offers.length === 1 ? 'One thing' : `${offers.length} things`} to claim
      </h1>
      <p className="text-[var(--ink-mute)] text-[var(--step--1)] mb-7">
        Start one at the counter, not before. Ten minutes each, one use only.
      </p>

      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {offers.map((offer) => (
          <li key={offer.scanId}>
            <OfferCard offer={offer} />
          </li>
        ))}
      </ul>

      <Link
        href="/progress"
        className="block mt-8 text-[var(--step--1)] text-[var(--tb-violet)] underline underline-offset-4"
      >
        Back to your numbers
      </Link>
    </main>
  );
}
