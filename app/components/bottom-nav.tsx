'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Two tabs, because there are exactly two things a player owns: the numbers
 * they've collected and the food they've earned.
 *
 * Fixed rather than sticky. The footer sits after this in the layout, so a
 * sticky bar came to rest above it in the middle of a short page. The spacer
 * keeps the footer reachable underneath.
 */
export default function BottomNav({ unusedOffers }: { unusedOffers: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/progress', label: 'Your numbers' },
    { href: '/offers', label: 'Your offers' },
  ];

  return (
    <>
      <div aria-hidden="true" className="h-20" />
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--ground-deepest)] border-t border-[var(--line)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto w-full max-w-md px-5 h-16 grid grid-cols-2 items-stretch list-none m-0 p-0">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href} className="h-full">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="h-full flex flex-col items-center justify-center gap-2 relative"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 left-4 right-4 h-[3px] rounded-b-sm ${
                      active ? 'bg-[var(--tb-white)]' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`label ${active ? '!text-[var(--ink)]' : '!text-[var(--ink-dim)]'}`}
                  >
                    {tab.label}
                  </span>
                  {tab.href === '/offers' && unusedOffers > 0 && (
                    <span
                      aria-label={`${unusedOffers} unused`}
                      className="absolute top-3 right-6 w-2 h-2 rounded-full bg-[var(--tb-white)]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
