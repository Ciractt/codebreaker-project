import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { getParticipantProgress } from '@/lib/code';
import { readSession } from '@/lib/session';
import CodeStrip from '@/app/components/code-strip';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const participantId = await readSession();

  if (!participantId) {
    return (
      <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
        <p className="label mb-4">Your numbers</p>
        <h1 className="display text-[var(--step-2)] mb-3">Nothing yet</h1>
        <p className="text-[var(--ink-mute)]">
          Find one of the four codes around Darlington to start.
        </p>
      </main>
    );
  }

  const progress = await getParticipantProgress(getAdminClient(), participantId);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <CodeStrip progress={progress} />
      <Link
        href="/offers"
        className="block mt-8 text-[var(--step--1)] text-[var(--tb-violet)] underline underline-offset-4"
      >
        Your offers
      </Link>
    </main>
  );
}
