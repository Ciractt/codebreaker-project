'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'That didn\u2019t work.');
        return;
      }
      router.replace('/staff');
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)] mb-3';

  return (
    <div>
      <label htmlFor="staff-email" className="label block mb-2">
        Email
      </label>
      <input
        id="staff-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={inputClass}
      />

      <label htmlFor="staff-password" className="label block mb-2">
        Password
      </label>
      <input
        id="staff-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
        }}
        className={inputClass}
      />

      {error && (
        <p role="alert" className="notice mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-full h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
      >
        {busy ? 'Signing in\u2026' : 'Sign in'}
      </button>

      <Link
        href="/staff/forgot"
        className="block mt-6 text-[var(--step--1)] text-[var(--ink)] underline underline-offset-4"
      >
        Forgotten your password?
      </Link>
    </div>
  );
}
