import { getAdminClient } from '@/lib/supabase/admin';
import { getActivePromo } from '@/lib/promos';

/**
 * The promo banner. Sits beneath the page's own content, never above it —
 * someone who has just scanned a code came for their numbers, not an advert.
 *
 * Renders nothing at all when there is no active promo, rather than leaving a
 * placeholder box on the page.
 */
export default async function PromoSlot() {
  const promo = await getActivePromo(getAdminClient());
  if (!promo) return null;

  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={promo.imageUrl}
        alt={promo.title}
        width={900}
        height={241}
        className="w-full h-auto block"
      />
      {promo.linkUrl && (
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/55 flex items-center justify-center"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      )}
    </>
  );

  const shell = 'relative block w-full overflow-hidden rounded-[var(--radius-card)]';

  if (!promo.linkUrl) {
    return <div className={`${shell} mt-10`}>{inner}</div>;
  }

  return (
    <a
      href={promo.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} mt-10`}
    >
      {inner}
      <span className="sr-only">{promo.title} (opens in a new tab)</span>
    </a>
  );
}
