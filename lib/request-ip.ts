import 'server-only';

/**
 * The client's address, as far as it can be trusted.
 *
 * x-forwarded-for is a chain the client can start: send
 * `X-Forwarded-For: 1.2.3.4` and the proxy appends its view, so the FIRST
 * entry is attacker-controlled. Taking [0] meant anyone could rotate a fake
 * address on every request and walk straight through the flood guard.
 *
 * Vercel sets x-real-ip to the connecting address it actually observed, which
 * is the one that cannot be forged. Falling back to the LAST forwarded entry
 * is the next best thing — that is the hop closest to us.
 */
export function clientIp(request: Request): string | null {
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();

  const vercel = request.headers.get('x-vercel-forwarded-for');
  if (vercel) {
    const parts = vercel.split(',');
    return parts[parts.length - 1].trim();
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }

  return null;
}
