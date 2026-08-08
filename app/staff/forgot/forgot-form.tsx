'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

export default function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/staff/reset`,
      });
      // Always report success — telling someone whether an address has an
      // account is a free list of who works here.
      if (resetError) setError('Could not send that. Try again in a moment.');
      else setSent(true);
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div>
        <p className="mb-6">
          If that address has an account, there&rsquo;s a link on its way. It works once and
          expires after an hour.
        </p>
        <Link
          href="/staff/login"
          className="text-[var(--step--1)] text-[var(--ink)] underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="email" className="label block mb-2">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && email) send();
        }}
        className="w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] mb-3"
      />

      {error && (
        <p role="alert" className="notice mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={send}
        disabled={busy || !email}
        className="w-full h-12 rounded-[var(--radius)] font-bold bg-[var(--tb-white)] text-[var(--ink-on-white)] disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)] disabled:border disabled:border-[var(--line)]"
      >
        {busy ? 'Sending\u2026' : 'Send the link'}
      </button>

      <Link
        href="/staff/login"
        className="block mt-6 text-[var(--step--1)] text-[var(--ink)] underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  );
}
