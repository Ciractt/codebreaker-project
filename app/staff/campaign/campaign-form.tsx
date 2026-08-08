'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Settings {
  campaign_name: string;
  starts_at: string;
  ends_at: string;
  is_won: boolean;
  won_at: string | null;
}

function forInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

const field =
  'w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)]';

export default function CampaignForm({
  settings,
  safeCode,
  rotatedAt,
  affected,
  isLive,
}: {
  settings: Settings | null;
  safeCode: string | null;
  rotatedAt: string | null;
  affected: number;
  isLive: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    campaign_name: settings?.campaign_name ?? '',
    starts_at: settings ? forInput(settings.starts_at) : '',
    ends_at: settings ? forInput(settings.ends_at) : '',
    is_won: settings?.is_won ?? false,
  });
  const [showCode, setShowCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; payload: object } | null>(null);
  const [unlocked, setUnlocked] = useState(!isLive);

  async function send(payload: object) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/staff/campaign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.status === 409 && data.needsConfirm) {
        setConfirm({ message: data.message, payload });
        return;
      }
      if (!response.ok) {
        setError(data.error ?? 'Could not save that.');
        return;
      }

      setConfirm(null);
      setNewCode('');
      setMessage('Saved.');
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="display text-[length:var(--step-2)] mb-7">Campaign</h1>

      <div className="flex flex-col gap-5 mb-10 admin-form">
        <div>
          <label htmlFor="name" className="label block mb-2">Name</label>
          <input
            id="name"
            className={field}
            value={form.campaign_name}
            onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="starts" className="label block mb-2">Opens</label>
            <input
              id="starts"
              type="datetime-local"
              className={field}
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="ends" className="label block mb-2">Closes</label>
            <input
              id="ends"
              type="datetime-local"
              className={field}
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_won}
            onChange={(e) => setForm({ ...form, is_won: e.target.checked })}
            className="w-5 h-5 accent-[var(--tb-white)]"
          />
          <span>The safe has been opened</span>
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            send({
              campaign_name: form.campaign_name,
              starts_at: new Date(form.starts_at).toISOString(),
              ends_at: new Date(form.ends_at).toISOString(),
              is_won: form.is_won,
            })
          }
          className="h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
        >
          {busy ? 'Saving\u2026' : 'Save changes'}
        </button>

        {message && <p className="text-[length:var(--step--1)] text-[var(--ink-mute)]">{message}</p>}
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
      </div>

      <section className="pt-6 border-t border-[var(--line)] admin-form">
        <h2 className="label mb-3">The safe code</h2>

        <div className="rounded-[var(--radius)] p-4 mb-5" style={{ background: 'var(--card)' }}>
          <p className="display text-[length:var(--step-2)] tracking-[0.14em] mb-3 tabular-nums">
            {showCode ? (safeCode ?? 'not set') : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
          </p>
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="text-[length:var(--step--1)] text-[var(--ink)] underline underline-offset-4"
          >
            {showCode ? 'Hide' : 'Show the code'}
          </button>
          {rotatedAt && (
            <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-3">
              Set {new Date(rotatedAt).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>

        <label htmlFor="newcode" className="label block mb-2">Replace it</label>
        <input
          id="newcode"
          className={`${field} mb-3 display tracking-[0.12em]`}
          inputMode="numeric"
          maxLength={8}
          placeholder="8 digits, 1-9, no repeats"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.replace(/[^1-9]/g, ''))}
        />
        {isLive && (
          <label className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              checked={unlocked}
              onChange={(e) => setUnlocked(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[var(--tb-white)] shrink-0"
            />
            <span className="text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
              The campaign is live. Tick to unlock rotating the code.
            </span>
          </label>
        )}

        <button
          type="button"
          disabled={busy || newCode.length !== 8 || !unlocked}
          onClick={() => send({ safe_code: newCode })}
          className="w-full h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold disabled:opacity-35"
        >
          Rotate the code
        </button>
        <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-3 leading-relaxed">
          Only if the numbers have leaked. {affected}{' '}
          {affected === 1 ? 'player is' : 'players are'} holding numbers from the current one, and
          rotating makes every one of them wrong. You&rsquo;d also need to reset the physical safe.
        </p>
      </section>

      {confirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-5"
        >
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--ground-deep)] p-6">
            <h2 className="display text-[length:var(--step-1)] mb-3">Hold on</h2>
            <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-6 leading-relaxed">
              {confirm.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => send({ ...confirm.payload, confirmDestructive: true })}
                className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
              >
                Do it anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
