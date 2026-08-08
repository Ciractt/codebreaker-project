'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

type Stage = 'checking' | 'ready' | 'invalid' | 'done';

const field =
  'w-full h-12 px-4 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] mb-3';

export default function ResetForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase returns the recovery tokens in the URL fragment, which never
  // reaches the server. Establish the session here, then strip the fragment so
  // a live token isn't sitting in the address bar to be screenshotted or
  // pasted into a chat.
  useEffect(() => {
    let cancelled = false;

    async function establish() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        if (!cancelled) setStage('invalid');
        return;
      }

      try {
        const supabase = getBrowserClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState(null, '', window.location.pathname);
        if (!cancelled) setStage(sessionError ? 'invalid' : 'ready');
      } catch {
        if (!cancelled) setStage('invalid');
      }
    }

    establish();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (password.length < 10) {
      setError('Ten characters or more.');
      return;
    }
    if (password !== confirm) {
      setError('Those two don\u2019t match.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Could not set that. The link may have expired.');
        return;
      }
      setStage('done');
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'checking') {
    return <p className="text-[var(--ink-mute)]">Checking your link&hellip;</p>;
  }

  if (stage === 'invalid') {
    return (
      <div>
        <p className="mb-6">
          That link has expired or has already been used. Reset links work once and last an hour.
        </p>
        <Link
          href="/staff/forgot"
          className="inline-flex h-12 px-6 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold items-center justify-center"
        >
          Send a new one
        </Link>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div>
        <p className="mb-6">That&rsquo;s set. You&rsquo;re signed in.</p>
        <Link
          href="/staff"
          className="inline-flex h-12 px-6 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold items-center justify-center"
        >
          Go to the dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="password" className="label block mb-2">New password</label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={field}
      />

      <label htmlFor="confirm" className="label block mb-2">Again</label>
      <input
        id="confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
        className={field}
      />

      {error && (
        <p role="alert" className="text-[var(--step--1)] text-[var(--tb-violet)] mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full h-12 rounded-[var(--radius)] bg-[var(--tb-violet)] text-[var(--tb-white)] font-bold disabled:opacity-45"
      >
        {busy ? 'Saving\u2026' : 'Save and sign in'}
      </button>
    </div>
  );
}
