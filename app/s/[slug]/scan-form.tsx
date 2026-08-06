'use client';

import { useState } from 'react';
import CodeStrip, { type Progress } from '@/app/components/code-strip';

export default function ScanForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function submit() {
    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'That didn\u2019t work. Try again.');
        setStatus('idle');
        return;
      }

      setProgress(payload.progress);
      setStatus('done');
    } catch {
      setError('No connection. Check your signal and try again.');
      setStatus('idle');
    }
  }

  if (status === 'done' && progress) {
    return <CodeStrip progress={progress} />;
  }

  return (
    <div>
      <p className="label mb-4">Code breaker &middot; Darlington</p>

      <h1 className="display text-[var(--step-3)] mb-3">You found one.</h1>
      <p className="text-[var(--ink-mute)] mb-8 max-w-[var(--measure)]">
        Drop your email in and we&rsquo;ll hand over your two numbers, plus something free to pick
        up in store.
      </p>

      <label htmlFor="email" className="label block mb-2">
        Email address
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && email) submit();
        }}
        className="w-full h-12 px-4 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)] mb-3"
      />

      {error && (
        <p role="alert" className="text-[var(--step--1)] text-[var(--tb-violet)] mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!email || status === 'sending'}
        className="w-full h-12 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold disabled:opacity-45"
      >
        {status === 'sending' ? 'Checking\u2026' : 'Get my numbers'}
      </button>

      <p className="text-[var(--step--1)] text-[var(--ink-dim)] mt-6 leading-relaxed">
        We use your email to hold your progress and nothing else. No marketing, no emails from us.
      </p>
    </div>
  );
}
