'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Member {
  user_id: string;
  role: 'admin' | 'super_admin';
  display_name: string | null;
  store: string | null;
}

export default function TeamList({ team }: { team: Member[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(userId: string, role: 'admin' | 'super_admin') {
    setBusy(userId);
    setError(null);
    try {
      const response = await fetch('/api/staff/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not change that.');
        return;
      }
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {team.map((member) => (
          <li
            key={member.user_id}
            className="rounded-[var(--radius)] border border-[var(--line)] p-4"
          >
            <p className="mb-1">{member.display_name ?? 'Unnamed'}</p>
            <p className="text-[var(--step--1)] text-[var(--ink-dim)] mb-3">
              {member.store ?? 'No store set'}
            </p>
            <div className="flex gap-2">
              {(['admin', 'super_admin'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={busy === member.user_id || member.role === role}
                  onClick={() => setRole(member.user_id, role)}
                  className={`flex-1 h-10 rounded-[var(--radius)] label ${
                    member.role === role
                      ? 'bg-[var(--tb-violet)] !text-[var(--tb-white)]'
                      : 'border border-[var(--line-strong)]'
                  }`}
                >
                  {role === 'admin' ? 'Admin' : 'Super admin'}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-[var(--step--1)] text-[var(--tb-violet)] mt-4">
          {error}
        </p>
      )}
    </div>
  );
}
