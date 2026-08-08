import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--ground-deep)] border-t border-[var(--line)] mt-12">
      <div className="mx-auto w-full max-w-md px-5 py-7">
        <nav className="flex gap-5 mb-4">
          <Link
            href="/privacy"
            className="text-[var(--step--1)] text-[var(--ink-mute)] underline underline-offset-4"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[var(--step--1)] text-[var(--ink-mute)] underline underline-offset-4"
          >
            Terms
          </Link>
        </nav>
        {/* TODO: confirm the promoter name and address with QFM before launch. */}
        <p className="text-[var(--step--1)] text-[var(--ink-dim)] leading-relaxed">
          Promoted by QFM Group. Taco Bell and the bell logo are trademarks of Taco Bell Corp.
        </p>
      </div>
    </footer>
  );
}
