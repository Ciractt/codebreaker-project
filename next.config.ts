import type { NextConfig } from 'next';

/**
 * Security headers.
 *
 * Worth being straight about what these do and don't buy. script-src carries
 * 'unsafe-inline' because Next inlines its bootstrap; tightening that needs
 * per-request nonces and is worth doing later, not two weeks before an
 * opening. So the CSP here is not meaningful XSS protection — React's escaping
 * is what's doing that work.
 *
 * What it does buy: frame-ancestors stops the admin being framed and
 * clickjacked into a destructive confirm, and connect-src means a script that
 * did get in cannot post data to an arbitrary host.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        // The admin should never be cached by a proxy or a shared browser.
        source: '/staff/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
