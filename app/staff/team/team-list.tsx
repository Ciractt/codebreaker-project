'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TeamMember } from '@/lib/admin';
import type { StaffRole } from '@/lib/supabase/staff';

const field =
  'w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)]';

export default function TeamList({
  team,
  viewerRole,
  viewerEmail,
}: {
  team: TeamMember[];
  viewerRole: StaffRole;
  viewerEmail: string;
}) {
  const router = useRouter();
  const isSuper = viewerRole === 'super_admin';

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    email: '',
    display_name: '',
    store: '',
    role: 'admin' as StaffRole,
  });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  async function call(method: 'POST' | 'PATCH' | 'DELETE', payload: object, key: string) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch('/api/staff/team', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'That didn\u2019t work.');
        return null;
      }
      router.refresh();
      return data;
    } catch {
      setError('No connection. Try again.');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    const data = await call('POST', draft, 'create');
    if (data?.password) {
      setCreated({ email: data.email, password: data.password });
      setAdding(false);
      setDraft({ email: '', display_name: '', store: '', role: 'admin' });
    }
  }

  return (
    <div>
      {created && (
        <div
          className="rounded-[var(--radius-card)] p-5 mb-7"
          style={{ background: 'rgba(154, 35, 248, 0.16)' }}
        >
          <p className="label mb-2">Account created</p>
          <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-4 leading-relaxed">
            This password shows once and is not stored anywhere you can read it again. Send it to{' '}
            {created.email}, and have them change it at the sign-in page.
          </p>
          <p className="display text-[length:var(--step-1)] tracking-[0.06em] break-all mb-4">
            {created.password}
          </p>
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="h-11 px-6 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
          >
            Done
          </button>
        </div>
      )}

      <ul className="list-none p-0 m-0 flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {team.map((member) => {
          const isSelf = member.email === viewerEmail;
          return (
            <li
              key={member.user_id}
              className="rounded-[var(--radius)] p-4"
              style={{ background: 'var(--card)' }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="truncate">
                  {member.display_name ?? 'Unnamed'}
                  {isSelf && <span className="text-[var(--ink-dim)]"> &middot; you</span>}
                </p>
                <span
                  className="label shrink-0"
                  style={{
                    color:
                      member.role === 'super_admin' ? 'var(--data-done)' : 'var(--ink-dim)',
                  }}
                >
                  {member.role === 'super_admin' ? 'Super admin' : 'Admin'}
                </span>
              </div>

              <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] break-all mb-1">
                {member.email}
              </p>
              <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-3">
                {member.store ?? 'No store set'}
                {member.last_sign_in
                  ? ` · last in ${new Date(member.last_sign_in).toLocaleDateString('en-GB')}`
                  : ' · never signed in'}
              </p>

              {isSuper && (
                <div className="flex gap-2">
                  {(['admin', 'super_admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      disabled={busy !== null || member.role === role}
                      onClick={() => call('PATCH', { user_id: member.user_id, role }, member.user_id)}
                      className={`flex-1 h-10 rounded-[var(--radius)] label ${
                        member.role === role
                          ? 'bg-[var(--tb-white)] !text-[var(--ink-on-white)]'
                          : 'border border-[var(--line-strong)]'
                      }`}
                    >
                      {role === 'admin' ? 'Admin' : 'Super'}
                    </button>
                  ))}
                  {!isSelf && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setConfirmRemove(member)}
                      className="h-10 px-4 rounded-[var(--radius)] border border-[var(--line-strong)] label"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="notice mt-4">
          {error}
        </p>
      )}

      <section className="mt-8">
        {adding ? (
          <div
            className="rounded-[var(--radius-card)] p-5 admin-form"
            style={{ background: 'var(--card)' }}
          >
            <p className="label mb-4">New account</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label block mb-2">Name</label>
                <input
                  className={field}
                  value={draft.display_name}
                  onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-2">Work email</label>
                <input
                  className={field}
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-2">Store or team (optional)</label>
                <input
                  className={field}
                  placeholder="Darlington"
                  value={draft.store}
                  onChange={(e) => setDraft({ ...draft, store: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-2">Rank</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, role: 'admin' })}
                    className={`flex-1 h-11 rounded-[var(--radius)] label ${
                      draft.role === 'admin'
                        ? 'bg-[var(--tb-white)] !text-[var(--ink-on-white)]'
                        : 'border border-[var(--line-strong)]'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    disabled={!isSuper}
                    onClick={() => setDraft({ ...draft, role: 'super_admin' })}
                    className={`flex-1 h-11 rounded-[var(--radius)] label disabled:opacity-35 ${
                      draft.role === 'super_admin'
                        ? 'bg-[var(--tb-white)] !text-[var(--ink-on-white)]'
                        : 'border border-[var(--line-strong)]'
                    }`}
                  >
                    Super admin
                  </button>
                </div>
                {!isSuper && (
                  <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-2">
                    Only a super admin can create another super admin.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy !== null || !draft.email || !draft.display_name}
                  onClick={create}
                  className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
                >
                  {busy === 'create' ? 'Creating\u2026' : 'Create account'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full md:w-auto md:px-8 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold"
          >
            Add someone
          </button>
        )}
      </section>

      {confirmRemove && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-5"
        >
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--ground-deep)] p-6">
            <h2 className="display text-[length:var(--step-1)] mb-3">
              Remove {confirmRemove.display_name ?? confirmRemove.email}?
            </h2>
            <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-6 leading-relaxed">
              Their account is deleted and they lose access straight away. Nothing they changed is
              undone, and the audit trail keeps their name.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  await call('DELETE', { user_id: confirmRemove.user_id }, confirmRemove.user_id);
                  setConfirmRemove(null);
                }}
                className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:opacity-45"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
