import Link from 'next/link';

export default function EmptyState({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: string;
  body: string;
}) {
  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <p className="label mb-4">{eyebrow}</p>
      <h1 className="display text-[var(--step-2)] mb-3">{heading}</h1>
      <p className="text-[var(--ink-mute)] mb-8 max-w-[var(--measure)]">{body}</p>
      <Link
        href="/"
        className="inline-flex h-12 px-6 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold items-center justify-center"
      >
        How it works
      </Link>
    </main>
  );
}
