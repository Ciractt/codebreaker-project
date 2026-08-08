'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * A slim strip pinned under the tabs, carrying the things that have to be
 * reachable from anywhere: the privacy and terms links, who is promoting this,
 * and Taco Bell's mark.
 *
 * It replaces the old standalone footer rather than joining it. Legal that
 * lives at the bottom of a scrolling page is legal nobody finds.
 *
 * Hidden on /staff — a till-side tool is not a public promotion.
 */
export default function LegalBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/staff')) return null;

  return (
    <>
      <div aria-hidden="true" className="h-9" />
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--tb-black)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto w-full max-w-md px-5 h-9 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <Link
            href="/privacy"
            className="text-[length:var(--step--1)] text-[var(--ink)] underline underline-offset-2"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[length:var(--step--1)] text-[var(--ink)] underline underline-offset-2"
          >
            Terms
          </Link>
          {/* TODO: confirm the promoter's registered name with QFM before launch. */}
          <span className="text-[length:var(--step--1)] text-[var(--ink-dim)]">
            Promoted by QFM Group
          </span>
          <span className="text-[length:var(--step--1)] text-[var(--ink-dim)]">
            &copy; 2026 by Taco Bell Corp.
          </span>
        </div>
      </div>
    </>
  );
}
