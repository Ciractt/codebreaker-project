'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch('/api/staff/logout', { method: 'POST' });
    router.replace('/staff/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="w-full h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold disabled:opacity-45"
    >
      Sign out
    </button>
  );
}
