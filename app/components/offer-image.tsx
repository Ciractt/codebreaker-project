/**
 * Offer artwork. Real product shots go in `locations.offer_image_url` once
 * Taco Bell send them; until then this renders a branded tile rather than a
 * grey box, so the layout is honest about its final proportions.
 */
export default function OfferImage({
  src,
  title,
  dimmed = false,
}: {
  src: string | null;
  title: string;
  dimmed?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className={`w-full aspect-[16/9] object-cover rounded-[var(--radius)] mb-4 ${
          dimmed ? 'grayscale' : ''
        }`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="w-full aspect-[16/9] rounded-[var(--radius)] mb-4 flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--tb-purple), var(--surface-2))`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/taco-bell-bell-white.png"
        alt=""
        className="h-[60%] w-auto opacity-15"
      />
    </div>
  );
}
