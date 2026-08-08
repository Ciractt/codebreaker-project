'use client';

import Link from 'next/link';
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
      setError('That didn\u2019t save. Try again in a moment.');
      setStatus('idle');
    }
  }

  if (status === 'done' && progress) {
    return (
      <div>
        <CodeStrip progress={progress} />
        <div className="flex flex-col gap-3 mt-8">
          <Link
            href="/offers"
            className="h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold flex items-center justify-center"
          >
            Claim your free item
          </Link>
          <Link
            href="/progress"
            className="h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold flex items-center justify-center"
          >
            Your numbers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display text-[length:var(--step-3)] mb-3">You found one.</h1>
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
        className="w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)] mb-3"
      />

      {error && (
        <p role="alert" className="notice mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!email || status === 'sending'}
        className="w-full h-12 rounded-[var(--radius)] font-bold transition-colors bg-[var(--tb-white)] text-[var(--ink-on-white)] disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)] disabled:border disabled:border-[var(--line)]"
      >
        {status === 'sending' ? 'Checking\u2026' : 'Get my numbers'}
      </button>

      <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-6 leading-relaxed">
        We use your email to hold your progress and nothing else. No marketing, no emails from us.
      </p>
    </div>
  );
}
