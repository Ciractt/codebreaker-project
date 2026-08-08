import type { Metadata, Viewport } from 'next';
import { gtStandard, gtCondensed, gtExpanded } from './fonts';
import SiteHeader from './components/site-header';
import LegalBar from './components/legal-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Code Breaker | Taco Bell Darlington',
  description:
    'Four codes hidden across Darlington. Find them all, crack the safe, win free food for a year.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0B0116',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-GB"
      className={`${gtStandard.variable} ${gtCondensed.variable} ${gtExpanded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <LegalBar />
      </body>
    </html>
  );
}
