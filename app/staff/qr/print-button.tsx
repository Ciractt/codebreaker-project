'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="w-full h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold"
    >
      Print all four
    </button>
  );
}
