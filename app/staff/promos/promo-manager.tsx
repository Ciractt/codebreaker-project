'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Promo } from '@/lib/promos';

const field =
  'w-full h-12 px-4 rounded-[var(--radius)] bg-black/20 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-dim)]';

interface Draft {
  title: string;
  image_url: string;
  link_url: string;
  sort_order: string;
}

const EMPTY: Draft = { title: '', image_url: '', link_url: '', sort_order: '1' };

export default function PromoManager({ promos }: { promos: Promo[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: 'POST' | 'PATCH' | 'DELETE', payload: object) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/staff/promos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not save that.');
        return;
      }
      setEditing(null);
      setAdding(false);
      setDraft(EMPTY);
      router.refresh();
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(promo: Promo) {
    setAdding(false);
    setEditing(promo.id);
    setDraft({
      title: promo.title,
      image_url: promo.imageUrl,
      link_url: promo.linkUrl ?? '',
      sort_order: String(promo.sortOrder),
    });
  }

  const form = (onSave: () => void, onCancel: () => void) => (
    <div className="flex flex-col gap-4 mt-4 admin-form">
      <div>
        <label className="label block mb-2">Title, and alt text</label>
        <input
          className={field}
          placeholder="Live Más Club — exclusive access"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-2">
          Screen readers announce this, so write what the banner says.
        </p>
      </div>

      <div>
        <label className="label block mb-2">Image path</label>
        <input
          className={field}
          placeholder="/promos/live-mas-club.jpg"
          value={draft.image_url}
          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
        />
      </div>

      <div>
        <label className="label block mb-2">Link (optional)</label>
        <input
          className={field}
          placeholder="https://www.tacobell.co.uk/..."
          value={draft.link_url}
          onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
        />
        <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mt-2">
          With a link it opens in a new tab and shows the arrow mark. Without one it&rsquo;s just
          an image.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--tb-white)] text-[var(--ink-on-white)] font-bold disabled:bg-[var(--surface)] disabled:text-[var(--ink-dim)]"
        >
          {busy ? 'Saving\u2026' : 'Save'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <ul className="list-none p-0 m-0 flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:items-start">
        {promos.map((promo) => (
          <li
            key={promo.id}
            className="rounded-[var(--radius-card)] border border-[var(--line)] p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={promo.imageUrl}
              alt=""
              className="w-full h-auto rounded-[var(--radius)] mb-3"
            />
            <p className="mb-1">{promo.title}</p>
            <p className="text-[length:var(--step--1)] text-[var(--ink-dim)] mb-4 break-all">
              {promo.linkUrl ?? 'No link'}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => send('PATCH', { id: promo.id, active: !promo.active })}
                className={`flex-1 h-10 rounded-[var(--radius)] label ${
                  promo.active
                    ? 'bg-[var(--tb-white)] !text-[var(--ink-on-white)]'
                    : 'border border-[var(--line-strong)]'
                }`}
              >
                {promo.active ? 'Showing' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => startEdit(promo)}
                className="flex-1 h-10 rounded-[var(--radius)] border border-[var(--line-strong)] label"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => send('DELETE', { id: promo.id })}
                className="flex-1 h-10 rounded-[var(--radius)] border border-[var(--line-strong)] label"
              >
                Remove
              </button>
            </div>

            {editing === promo.id &&
              form(
                () =>
                  send('PATCH', {
                    id: promo.id,
                    title: draft.title,
                    image_url: draft.image_url,
                    link_url: draft.link_url,
                    sort_order: Number(draft.sort_order) || 1,
                  }),
                () => setEditing(null),
              )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="notice mt-4">
          {error}
        </p>
      )}

      {adding ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] p-4">
          <p className="label">New banner</p>
          {form(
            () =>
              send('POST', {
                title: draft.title,
                image_url: draft.image_url,
                link_url: draft.link_url || null,
                sort_order: Number(draft.sort_order) || (promos.length + 1),
                active: false,
              }),
            () => {
              setAdding(false);
              setDraft(EMPTY);
            },
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDraft(EMPTY);
            setAdding(true);
          }}
          className="mt-6 w-full md:w-auto md:px-8 h-12 rounded-[var(--radius)] border border-[var(--line-strong)] text-[var(--ink)] font-bold"
        >
          Add a banner
        </button>
      )}

      <section className="mt-10 pt-6 border-t border-[var(--line)]">
        <h2 className="label mb-3">Getting an image in</h2>
        <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] leading-relaxed">
          Images live in <code>/public/promos</code> and are referenced by path. Uploading from
          this page needs Supabase Storage setting up first &mdash; worth doing if Taco Bell will
          swap creative mid-campaign, and skippable if they won&rsquo;t.
        </p>
      </section>
    </div>
  );
}
