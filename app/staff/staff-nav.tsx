'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { StaffRole } from '@/lib/supabase/staff';

/** Pages that authenticate rather than administer: no chrome, no tabs. */
const AUTH_PATHS = ['/staff/login', '/staff/forgot', '/staff/reset'];

export default function StaffNav({ role, email }: { role: StaffRole; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (AUTH_PATHS.includes(pathname)) return null;

  const tabs = [
    { href: '/staff', label: 'Stats', superOnly: false },
    { href: '/staff/locations', label: 'Codes', superOnly: true },
    { href: '/staff/campaign', label: 'Campaign', superOnly: true },
    { href: '/staff/promos', label: 'Promo', superOnly: true },
    { href: '/staff/qr', label: 'QR', superOnly: true },
    { href: '/staff/team', label: 'Team', superOnly: false },
  ].filter((tab) => !tab.superOnly || role === 'super_admin');

  async function signOut() {
    setBusy(true);
    await fetch('/api/staff/logout', { method: 'POST' });
    router.replace('/staff/login');
    router.refresh();
  }

  return (
    <div className="border-b border-[var(--line)]">
      <div className="admin-shell pt-5">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <p className="label truncate">
            {role === 'super_admin' ? 'Super admin' : 'Admin'}
            <span className="!text-[var(--ink-dim)]"> &middot; {email}</span>
          </p>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="text-[length:var(--step--1)] text-[var(--ink-dim)] underline underline-offset-4 shrink-0"
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-4 md:gap-6 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`label whitespace-nowrap pb-3 border-b-2 ${
                  active
                    ? '!text-[var(--ink)] border-[var(--tb-white)]'
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
