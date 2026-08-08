import Link from 'next/link';
import BrandMark from './brand-mark';

/**
 * Deliberately not sticky. The bottom nav handles getting around, so the
 * header can be a proper brand moment at the top and then get out of the way —
 * on a phone, a persistent 90px lockup is 90px not spent on the thing people
 * came for.
 */
export default function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto w-full max-w-md px-5 py-6 flex flex-col items-center gap-2">
        <Link
          href="/"
          aria-label="Code Breaker home"
          className="flex flex-col items-center gap-2"
        >
          <BrandMark size={46} />
          <span className="label !text-[var(--ink)]">Code breaker</span>
        </Link>
      </div>
    </header>
  );
}
