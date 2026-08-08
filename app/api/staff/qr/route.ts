import { getStaffClient, getStaffRole } from '@/lib/supabase/staff';
import { qrPng, qrSvg, scanUrl, type QrStyle } from '@/lib/qr';

/**
 * GET /api/staff/qr?id=<location>&format=svg|png&style=purple|black
 *
 * Super admin only — a QR code is the campaign's front door, and handing the
 * slug to anyone who can sign in defeats the point of it being unguessable.
 */
export async function GET(request: Request) {
  const staff = await getStaffRole();
  if (!staff) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (staff.role !== 'super_admin') {
    return Response.json({ error: 'Super admins only.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  const format = url.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const style: QrStyle = url.searchParams.get('style') === 'black' ? 'black' : 'purple';

  if (!id) return Response.json({ error: 'Which code?' }, { status: 400 });

  const supabase = await getStaffClient();
  const { data: location } = await supabase
    .from('locations')
    .select('slug, day_number, location_name')
    .eq('id', id)
    .maybeSingle();

  if (!location) return Response.json({ error: 'No such code.' }, { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const target = scanUrl(location.slug as string, siteUrl);

  const safeName = (location.location_name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const filename = `codebreaker-day${location.day_number}-${safeName}-${style}.${format}`;

  if (format === 'svg') {
    const svg = await qrSvg(target, style);
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const png = await qrPng(target, style);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
