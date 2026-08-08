'use client';

import { useEffect, useState } from 'react';
import type { Offer } from '@/lib/offers';
import OfferImage from './offer-image';

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OfferCard({ offer }: { offer: Offer }) {
  // One clock, ticking on the client only. The server has no idea what time it
  // is on the customer's phone, so `now` stays null through SSR and nothing
  // time-dependent renders until we're hydrated.
  const [now, setNow] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [opened, setOpened] = useState<{ code: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const tick = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);

  async function activate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: offer.scanId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Could not open that.');
        setConfirming(false);
        return;
      }
      setOpened({ code: payload.code, expiresAt: payload.expiresAt });
      setConfirming(false);
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const window = opened ?? (offer.expiresAt ? { code: offer.redemptionCode, expiresAt: offer.expiresAt } : null);

  const left =
    window && now !== null
      ? Math.max(0, Math.floor((new Date(window.expiresAt).getTime() - now) / 1000))
      : 0;

  const running = window !== null && now !== null && left > 0;
  const spent = window !== null && now !== null && left === 0;

  return (
    <div
      className={`rounded-[var(--radius-card)] overflow-hidden bg-[var(--surface-solid)] ${
        spent ? 'opacity-60' : ''
      }`}
    >
      <OfferImage src={offer.imageUrl} title={offer.offerTitle} dimmed={spent} />

      <div className="p-5">
        <p className="label !text-[var(--ink-on-white-dim)] mb-1">Day {offer.dayNumber}</p>
        <p className="display text-[length:var(--step-1)] text-[var(--ink-on-white)] mb-1">
          {offer.offerTitle}
        </p>

        {offer.offerDescription && !running && (
          <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-body)] mb-4">
            {offer.offerDescription}
          </p>
        )}

        {spent && (
          <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-dim)]">Used</p>
        )}

        {running && window && (
          <div className="mt-3">
            <p
              className="display text-[length:var(--step-4)] leading-none tabular-nums text-[var(--ink-on-white)]"
              aria-live="off"
            >
              {clock(left)}
            </p>
            <p className="label !text-[var(--ink-on-white-dim)] mt-2 mb-2">
              Show this screen to the team
            </p>
            <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-body)]">
              Reference {window.code}
            </p>
          </div>
        )}

        {!running && !spent && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-2 w-full h-11 rounded-[var(--radius)] bg-[var(--tb-purple)] text-[var(--tb-white)] font-bold"
          >
            Use this offer
          </button>
        )}

        {!running && !spent && confirming && (
          <div className="mt-2">
            <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-body)] mb-3">
              Only do this once you&rsquo;re at the counter. You get ten minutes and it
              won&rsquo;t come back.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 h-11 rounded-[var(--radius)] border border-[var(--line-on-white)] text-[var(--ink-on-white)] font-bold"
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={activate}
                disabled={busy}
                className="flex-1 h-11 rounded-[var(--radius)] bg-[var(--tb-purple)] text-[var(--tb-white)] font-bold disabled:opacity-45"
              >
                {busy ? 'Starting\u2026' : 'Start the timer'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 text-[length:var(--step--1)] text-[var(--ink-on-white)] border-l-[3px] border-[var(--tb-purple)] pl-3"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
