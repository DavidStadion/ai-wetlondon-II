import { useEffect } from 'preact/hooks';
import { venues, isLoading, error } from '@/signals/venueSignals';
import { fetchVenues } from '@/utils/supabase';
import { wetnessBand } from '@/utils/wetness';
import { toneFor } from '@/utils/venueTone';
import { labelCategory } from '@/utils/formatters';
import type { RouteProps, Venue } from '@/types';
import styles from './SwipePage.module.css';

/*
 * First slice of the swipe feed, deliberately thin.
 *
 * No filters, no save, no share. The only question this answers is whether a
 * full-height snap feed feels right on a real phone, because if the scroll is
 * half a beat off then none of the rest is worth building. Everything here is
 * CSS scroll-snap: no gesture handler, no drag maths, so the fling and the
 * rubber-banding are the platform's own and feel native for free.
 *
 * No imagery either. Every card is type on the category's own tone, which costs
 * nothing per card, where a Google photo costs a request against a capped
 * budget and makes each snap wait on a network round trip.
 */

const CARD_COUNT = 10;

/**
 * One venue per category, best first, so the tones visibly differ while
 * scrolling and the feed opens on something worth seeing. Taking them in table
 * order instead gave ten alphabetical entries starting at ABBA Voyage, with
 * Alexandra Palace and Alexandra Palace Ice Rink back to back.
 */
function spreadByCategory(all: Venue[], count: number): Venue[] {
  const picked: Venue[] = [];
  const usedTypes = new Set<string>();
  const usedNames = new Set<string>();
  const best = [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  for (const v of best) {
    const type = v.type?.[0];
    if (!type || usedTypes.has(type)) continue;
    usedTypes.add(type);
    usedNames.add(v.name);
    picked.push(v);
    if (picked.length === count) return picked;
  }

  // Fewer than `count` categories exist, so top up with whatever is left.
  for (const v of best) {
    if (usedNames.has(v.name)) continue;
    picked.push(v);
    if (picked.length === count) break;
  }
  return picked;
}

/** Up to the first full stop. The card clamps to two lines regardless. */
function openingLine(description: string | undefined): string {
  const d = (description ?? '').trim();
  const cut = d.indexOf('. ');
  return cut === -1 ? d : d.slice(0, cut + 1);
}

function SwipeCard({ venue, hint }: { venue: Venue; hint: boolean }) {
  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));
  const band = wetnessBand(wet);
  const initial = venue.name.trim().charAt(0).toUpperCase();

  return (
    <li className={styles.slot}>
      <article className={styles.face} style={{ background: toneFor(venue.type) }}>
        <span className={styles.rain} aria-hidden="true" />
        {/[A-Z0-9]/.test(initial) && (
          <span className={styles.initial} aria-hidden="true">{initial}</span>
        )}

        <div className={styles.body}>
          <p className={styles.meta}>
            {venue.type?.[0] ? labelCategory(venue.type[0]) : 'Indoors'}
            <span className={styles.dot} aria-hidden="true"> · </span>
            {band.label}
            <span className={styles.dot} aria-hidden="true"> · </span>
            {venue.priceDisplay}
          </p>
          <h2 className={styles.name}>{venue.name}</h2>
          <p className={styles.blurb}>{openingLine(venue.description)}</p>
        </div>

        {hint && <p className={styles.hint} aria-hidden="true">Swipe for the next</p>}
      </article>
    </li>
  );
}

export function SwipePage(_props: RouteProps) {
  useEffect(() => {
    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      error.value = null;
      try {
        venues.value = await fetchVenues();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load venues';
      } finally {
        isLoading.value = false;
      }
    }
    load();
  }, []);

  /*
   * The feed is a fixed layer over the whole app, so the page behind it must not
   * scroll underneath. Restored on unmount, including when the browser back
   * button is what closes it.
   */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const cards = spreadByCategory(venues.value, CARD_COUNT);

  return (
    <div className={styles.layer}>
      <a href="/" className={styles.close} aria-label="Close and go home">×</a>

      {isLoading.value && cards.length === 0 && (
        <p className={styles.state}>Getting the activities…</p>
      )}
      {error.value && <p className={styles.state}>{error.value}</p>}

      {/*
        * tabIndex makes the scroller focusable, which is what gives desktop
        * arrow keys, Page Up/Down, Home and End for free: a scroll container
        * only responds to them once it holds focus. It is also the only way a
        * keyboard user can move through the feed at all.
        */}
      {cards.length > 0 && (
        <ul className={styles.feed} tabIndex={0} aria-label="Activities, one per screen">
          {cards.map((v, i) => (
            <SwipeCard key={v.name} venue={v} hint={i === 0} />
          ))}
        </ul>
      )}
    </div>
  );
}
