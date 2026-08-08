'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { StaffRole } from '@/lib/supabase/staff';

export default function StaffNav({ role, email }: { role: StaffRole; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const tabs = [
    { href: '/staff', label: 'Stats', superOnly: false },
    { href: '/staff/locations', label: 'Codes', superOnly: true },
    { href: '/staff/campaign', label: 'Campaign', superOnly: true },
    { href: '/staff/team', label: 'Team', superOnly: true },
  ].filter((tab) => !tab.superOnly || role === 'super_admin');

  async function signOut() {
    setBusy(true);
    await fetch('/api/staff/logout', { method: 'POST' });
    router.replace('/staff/login');
    router.refresh();
  }

  return (
    <div className="border-b border-[var(--line)]">
      <div className="mx-auto w-full max-w-md px-5 pt-5">
        <div className="flex items-baseline justify-between mb-4">
          <p className="label">{role === 'super_admin' ? 'Super admin' : 'Admin'}</p>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="text-[var(--step--1)] text-[var(--ink-dim)] underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
        <p className="text-[var(--step--1)] text-[var(--ink-dim)] mb-4">{email}</p>
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`label whitespace-nowrap pb-3 border-b-2 ${
                  active
                    ? '!text-[var(--tb-violet)] border-[var(--tb-violet)]'
                    : 'border-transparent'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
