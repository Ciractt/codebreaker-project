import localFont from 'next/font/local';

/**
 * GT America, licensed from Grilli Type and supplied by Taco Bell.
 *
 * The .woff2 files are gitignored — see README. Drop them into app/fonts/
 * before running the app or the build will fail with a module-not-found,
 * which is deliberate: a missing licensed font should be loud, not silent.
 */

export const gtStandard = localFont({
  variable: '--font-gt-standard',
  display: 'swap',
  src: [
    { path: './fonts/GT-America-Standard-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/GT-America-Standard-Regular-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/GT-America-Standard-Bold.woff2', weight: '700', style: 'normal' },
  ],
});

export const gtCondensed = localFont({
  variable: '--font-gt-condensed',
  display: 'swap',
  src: [{ path: './fonts/GT-America-Condensed-Bold.woff2', weight: '700', style: 'normal' }],
});

export const gtExpanded = localFont({
  variable: '--font-gt-expanded',
  display: 'swap',
  src: [{ path: './fonts/GT-America-Expanded-Bold.woff2', weight: '700', style: 'normal' }],
});
