'use client';

import { useState } from 'react';

/**
 * The bell. Gitignored like the fonts — it's a trademark and this repo is
 * public — so it falls back to a text wordmark rather than a broken image if
 * someone clones without the brand assets.
 */
export default function BrandMark({ size = 26 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="label !text-[var(--ink)]" style={{ letterSpacing: '0.1em' }}>
        Taco Bell
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/taco-bell-bell-white.png"
      alt="Taco Bell"
      width={size}
      height={Math.round(size * 1.077)}
      onError={() => setFailed(true)}
      style={{ height: 'auto' }}
    />
  );
}
