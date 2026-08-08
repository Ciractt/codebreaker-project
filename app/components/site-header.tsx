import Link from 'next/link';
import BrandMark from './brand-mark';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[var(--ground)]/92 backdrop-blur-sm border-b border-[var(--line)]">
      <div className="mx-auto w-full max-w-md px-5 h-14 flex items-center gap-3">
        <Link href="/" aria-label="Code Breaker home" className="flex items-center gap-3">
          <BrandMark />
          <span className="label !text-[var(--ink)]">Code breaker</span>
        </Link>
      </div>
    </header>
  );
}
