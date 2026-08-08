import { redirect } from 'next/navigation';
import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { qrDataUri, scanUrl } from '@/lib/qr';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR codes | Code Breaker' };

export default async function QrPage() {
  const staff = await getStaffRole();
  if (!staff) redirect('/staff/login');
  if (staff.role !== 'super_admin') redirect('/staff');

  const supabase = await getStaffClient();
  const { data: locations } = await supabase
    .from('locations')
    .select('id, day_number, sort_order, location_name, offer_title, slug, active')
    .order('sort_order');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const codes = await Promise.all(
    (locations ?? []).map(async (location) => ({
      ...location,
      url: scanUrl(location.slug as string, siteUrl),
      preview: await qrDataUri(scanUrl(location.slug as string, siteUrl), 'purple'),
    })),
  );

  return (
    <main className="admin-shell flex-1 py-7 print:max-w-none">
      <div className="print:hidden">
        <h1 className="display text-[length:var(--step-2)] mb-2">QR codes</h1>
        <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-4 leading-relaxed max-w-[60ch]">
          Generated live from each code&rsquo;s link, so these are always current. Change a link
          and the old print is dead — regenerate before sending anything to a printer.
        </p>

        {!siteUrl.startsWith('https://') && (
          <p className="notice mb-6">
            These point at <strong>{siteUrl || 'no site URL'}</strong>. Set
            NEXT_PUBLIC_SITE_URL to the live domain before printing, or every sticker in
            Darlington will point at a laptop.
          </p>
        )}

        <div className="md:max-w-xs"><PrintButton /></div>
      </div>

      <ul className="list-none p-0 m-0 flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 mt-7 print:flex print:flex-col print:gap-0">
        {codes.map((code) => (
          <li
            key={code.id}
            className="rounded-[var(--radius-card)] bg-[var(--surface-solid)] p-5 print:break-after-page print:rounded-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={code.preview}
              alt={`QR code for ${code.location_name}`}
              className="w-full h-auto mb-4"
            />

            <p className="label !text-[var(--ink-on-white-dim)] mb-1">
              Day {code.day_number}
              {!code.active && ' · out of play'}
            </p>
            <p className="display text-[length:var(--step-1)] text-[var(--ink-on-white)] mb-1">
              {code.location_name}
            </p>
            <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-body)] mb-4">
              {code.offer_title}
            </p>

            <p className="text-[length:var(--step--1)] text-[var(--ink-on-white-dim)] break-all mb-4 print:hidden">
              {code.url}
            </p>

            <a
              href={code.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 mb-2 rounded-[var(--radius)] bg-[var(--tb-purple)] text-[var(--tb-white)] font-bold flex items-center justify-center gap-2 print:hidden"
            >
              Open the scan page
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>

            <div className="grid grid-cols-2 gap-2 print:hidden">
              <a
                href={`/api/staff/qr?id=${code.id}&format=svg&style=purple`}
                className="h-11 rounded-[var(--radius)] border border-[var(--line-on-white)] text-[var(--ink-on-white)] flex items-center justify-center label !text-[var(--ink-on-white)]"
              >
                SVG purple
              </a>
              <a
                href={`/api/staff/qr?id=${code.id}&format=svg&style=black`}
                className="h-11 rounded-[var(--radius)] border border-[var(--line-on-white)] text-[var(--ink-on-white)] flex items-center justify-center label !text-[var(--ink-on-white)]"
              >
                SVG black
              </a>
              <a
                href={`/api/staff/qr?id=${code.id}&format=png&style=purple`}
                className="h-11 rounded-[var(--radius)] border border-[var(--line-on-white)] text-[var(--ink-on-white)] flex items-center justify-center label !text-[var(--ink-on-white)]"
              >
                PNG purple
              </a>
              <a
                href={`/api/staff/qr?id=${code.id}&format=png&style=black`}
                className="h-11 rounded-[var(--radius)] border border-[var(--line-on-white)] text-[var(--ink-on-white)] flex items-center justify-center label !text-[var(--ink-on-white)]"
              >
                PNG black
              </a>
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-10 pt-6 border-t border-[var(--line)] print:hidden">
        <h2 className="label mb-3">Before it goes to print</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2 max-w-[70ch] text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
          <li>
            Send the SVG, not the PNG. It stays sharp at any size; the PNG is there for slide
            decks and WhatsApp.
          </li>
          <li>
            Black scans in worse conditions than purple. Use black on anything small, matte, or
            likely to get scuffed, and purple where it&rsquo;s big and behind glass.
          </li>
          <li>
            Never crop the white border. That gap is part of the code and a printer trimming it
            will stop it scanning.
          </li>
          <li>
            Smallest safe size outdoors is about 3cm across for arm&rsquo;s length, 10cm if
            people scan from a couple of metres.
          </li>
          <li>Scan every printed proof with a real phone before the run. Every one.</li>
          <li>
            Opening a scan page from here behaves exactly like a customer scanning it. Put an
            email in and you create a real participant and a real offer, which will show in the
            stats &mdash; use a throwaway address when testing.
          </li>
        </ul>
      </section>
    </main>
  );
}
