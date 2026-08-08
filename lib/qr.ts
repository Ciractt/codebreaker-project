import 'server-only';
import QRCode from 'qrcode';

/**
 * QR generation for print.
 *
 * Error correction is fixed at H (30% recoverable). These end up on pavement
 * stickers and window vinyl in Darlington in September — scuffed, rained on,
 * photographed at an angle. The denser code is a cheap price for still
 * scanning when a corner has been kicked off.
 *
 * Margin is 4 modules, the spec minimum. Printers trim, and a QR without its
 * quiet zone does not scan.
 */

const OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 4,
};

/** Brand purple on white is 11.2:1 — well clear of what a scanner needs. */
export const STYLES = {
  purple: { dark: '#501098FF', light: '#FFFFFFFF' },
  black: { dark: '#000000FF', light: '#FFFFFFFF' },
} as const;

export type QrStyle = keyof typeof STYLES;

export function scanUrl(slug: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/s/${slug}`;
}

export async function qrSvg(url: string, style: QrStyle = 'purple'): Promise<string> {
  return QRCode.toString(url, { ...OPTIONS, type: 'svg', color: STYLES[style] });
}

export async function qrPng(
  url: string,
  style: QrStyle = 'purple',
  width = 2400,
): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTIONS, width, color: STYLES[style] });
}

/** Inline data URI, for showing a preview without a second request. */
export async function qrDataUri(url: string, style: QrStyle = 'purple'): Promise<string> {
  return QRCode.toDataURL(url, { ...OPTIONS, width: 600, color: STYLES[style] });
}
