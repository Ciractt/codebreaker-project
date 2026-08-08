'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Type-to-confirm rather than a dialog. A dialog trains people to click
 * through; typing the word makes you read the sentence above it.
 */
export default function ResetPanel({
  isLive,
  players,
}: {
  isLive: boolean;
  players: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ participants_removed: number; scans_removed: number } | null>(
    null,
  );

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/staff/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not reset.');
        return;
      }
      setDone(data.result);
      setTyped('');
      setOpen(false);
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 pt-6 border-t border-[var(--line)] admin-form">
      <h2 className="label mb-3">Start again</h2>

      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-4 leading-relaxed">
        Removes every player and everything they did &mdash; accounts, scans, offers claimed,
        attempts at the safe. The campaign itself is untouched: the four codes, their positions,
        the artwork, the safe code, the banner and the team all stay exactly as they are.
      </p>

      {done && (
        <p className="notice mb-4">
          Cleared {done.participants_removed}{' '}
          {done.participants_removed === 1 ? 'player' : 'players'} and {done.scans_removed}{' '}
          {done.scans_removed === 1 ? 'scan' : 'scans'}.
        </p>
      )}

      {isLive ? (
        <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] leading-relaxed">
          Not while the campaign is live. There&rsquo;s no version of a live day where deleting
          every player is the right move &mdash; change the dates first if you genuinely mean it.
        </p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
        >
          Clear the play data
        </button>
      ) : (
        <div>
          <p className="text-[length:var(--step--1)] text-[var(--ink)] mb-3 leading-relaxed">
            {players} {players === 1 ? 'player' : 'players'} will be deleted, along with their
            scans and offers. This cannot be undone. Type <strong>RESET</strong> to go ahead.
          </p>
          <input
            className="w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] display tracking-[0.12em] mb-3"
            value={typed}
            onChange={(e) => setTyped(e.target.value.toUpperCase())}
            placeholder="RESET"
            autoComplete="off"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped('');
              }}
              className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || typed !== 'RESET'}
              onClick={reset}
              className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
            >
              {busy ? 'Clearing\u2026' : 'Clear it'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="notice mt-4">
          {error}
        </p>
      )}
    </section>
  );
}
