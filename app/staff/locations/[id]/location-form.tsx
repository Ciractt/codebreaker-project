'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LocationRow {
  id: string;
  day_number: number;
  location_name: string;
  offer_title: string;
  offer_description: string | null;
  offer_image_url: string | null;
  slug: string;
  digit_positions: number[];
  reveals_positions: boolean;
  active: boolean;
  live_from: string;
  live_until: string;
}

function forInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

const field =
  'w-full h-12 px-4 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)]';

export default function LocationForm({
  location,
  affected,
  siteUrl,
  isLive,
}: {
  location: LocationRow;
  affected: number;
  siteUrl: string;
  isLive: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    location_name: location.location_name,
    offer_title: location.offer_title,
    offer_description: location.offer_description ?? '',
    offer_image_url: location.offer_image_url ?? '',
    day_number: String(location.day_number),
    live_from: forInput(location.live_from),
    live_until: forInput(location.live_until),
    active: location.active,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; payload: object } | null>(null);
  // While live, the link is behind a cover you have to lift first. Two
  // deliberate actions, not one click and a reflexive "yes".
  const [unlocked, setUnlocked] = useState(!isLive);

  async function send(payload: object) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/staff/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: location.id, ...payload }),
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
      <p className="label mb-2">Day {location.day_number}</p>
      <h1 className="display text-[var(--step-2)] mb-1">{location.location_name}</h1>
      <p className="text-[var(--step--1)] text-[var(--ink-mute)] mb-7 tabular-nums">
        Positions {location.digit_positions.join(' & ')}
        {location.reveals_positions ? ', shown to players' : ', hidden'} &middot; {affected}{' '}
        {affected === 1 ? 'player has' : 'players have'} scanned it
      </p>

      <section className="rounded-[var(--radius)] border border-[var(--line-strong)] p-4 mb-8">
        <h2 className="label mb-2">{location.active ? 'In play' : 'Out of play'}</h2>
        <p className="text-[var(--step--1)] text-[var(--ink-mute)] mb-4 leading-relaxed">
          {location.active
            ? 'Scanning this code works. Take it out if it has leaked or the spot is gone.'
            : 'Scanning this code tells people it is not in play. Nobody loses numbers they already have.'}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => send({ active: !location.active })}
          className="w-full h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold disabled:opacity-45"
        >
          {location.active ? 'Take it out of play' : 'Put it back in play'}
        </button>
      </section>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="label block mb-2">Where it is</label>
          <input
            id="name"
            className={field}
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="offer" className="label block mb-2">Offer</label>
          <input
            id="offer"
            className={field}
            value={form.offer_title}
            onChange={(e) => setForm({ ...form, offer_title: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="desc" className="label block mb-2">Offer detail</label>
          <input
            id="desc"
            className={field}
            value={form.offer_description}
            onChange={(e) => setForm({ ...form, offer_description: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="image" className="label block mb-2">Image path</label>
          <input
            id="image"
            className={field}
            placeholder="/offers/baja-blast.jpg"
            value={form.offer_image_url}
            onChange={(e) => setForm({ ...form, offer_image_url: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="from" className="label block mb-2">Live from</label>
            <input
              id="from"
              type="datetime-local"
              className={field}
              value={form.live_from}
              onChange={(e) => setForm({ ...form, live_from: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="until" className="label block mb-2">Until</label>
            <input
              id="until"
              type="datetime-local"
              className={field}
              value={form.live_until}
              onChange={(e) => setForm({ ...form, live_until: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-5 h-5 accent-[var(--tb-violet)]"
          />
          <span>In play</span>
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            send({
              location_name: form.location_name,
              offer_title: form.offer_title,
              offer_description: form.offer_description || null,
              offer_image_url: form.offer_image_url || null,
              day_number: Number(form.day_number),
              live_from: new Date(form.live_from).toISOString(),
              live_until: new Date(form.live_until).toISOString(),
              active: form.active,
            })
          }
          className="h-12 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold disabled:opacity-45"
        >
          {busy ? 'Saving\u2026' : 'Save changes'}
        </button>

        {message && <p className="text-[var(--step--1)] text-[var(--ink-mute)]">{message}</p>}
        {error && (
          <p role="alert" className="text-[var(--step--1)] text-[var(--tb-violet)]">
            {error}
          </p>
        )}
      </div>

      <section className="mt-10 pt-6 border-t border-[var(--line)]">
        <h2 className="label mb-3">The link behind the QR code</h2>
        <p className="text-[var(--step--1)] text-[var(--ink-mute)] break-all mb-4">
          {siteUrl}/s/{location.slug}
        </p>
        {isLive && (
          <label className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              checked={unlocked}
              onChange={(e) => setUnlocked(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[var(--tb-violet)] shrink-0"
            />
            <span className="text-[var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
              The campaign is live. Tick to unlock changing the link.
            </span>
          </label>
        )}

        <button
          type="button"
          disabled={busy || !unlocked}
          onClick={() => send({ regenerateSlug: true })}
          className="w-full h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold disabled:opacity-35"
        >
          Generate a new link
        </button>
        <p className="text-[var(--step--1)] text-[var(--ink-dim)] mt-3 leading-relaxed">
          Only if this one has leaked. Every QR code already printed for it stops working, and you
          would need to reprint before anyone could scan it again.
        </p>
      </section>

      {confirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-5"
        >
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface)] p-6">
            <h2 className="display text-[var(--step-1)] mb-3">Hold on</h2>
            <p className="text-[var(--step--1)] text-[var(--ink-mute)] mb-6 leading-relaxed">
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
                className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold disabled:opacity-45"
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
