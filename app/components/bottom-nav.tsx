'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Two tabs, because there are exactly two things a player owns: the numbers
 * they've collected and the food they've earned. Sits at the bottom for thumb
 * reach — this gets used one-handed, walking.
 */
export default function BottomNav({ unusedOffers }: { unusedOffers: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/progress', label: 'Your numbers' },
    { href: '/offers', label: 'Your offers' },
  ];

  return (
    <nav className="sticky bottom-0 z-20 bg-[var(--ground)]/92 backdrop-blur-sm border-t border-[var(--line)]">
      <ul className="mx-auto w-full max-w-md px-5 h-16 grid grid-cols-2 items-center list-none m-0 p-0">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="h-full">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`h-full flex items-center justify-center gap-2 label ${
                  active ? '!text-[var(--tb-violet)]' : ''
                }`}
              >
                {tab.label}
                {tab.href === '/offers' && unusedOffers > 0 && (
                  <span
                    aria-label={`${unusedOffers} unused`}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--tb-violet)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
