/**
 * Offer artwork. Taco Bell's product shots are 1370x650 on a near-white set,
 * which is why the card around this is white — a pale photo on a translucent
 * purple panel reads as a mistake rather than a choice.
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
        width={900}
        height={427}
        className={`w-full aspect-[137/65] object-cover ${dimmed ? 'grayscale opacity-70' : ''}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="w-full aspect-[137/65] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--ground-deepest), var(--tb-violet))' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/taco-bell-bell-white.png" alt="" className="h-[55%] w-auto opacity-20" />
    </div>
  );
}
