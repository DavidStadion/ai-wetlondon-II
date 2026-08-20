import { useEffect, useRef, useState } from 'preact/hooks';
import { venues, isLoading, error } from '@/signals/venueSignals';
import { fetchVenues } from '@/utils/supabase';
import { wetnessBand } from '@/utils/wetness';
import { labelCategory } from '@/utils/formatters';
import { situationsFor, SITUATIONS } from '@/utils/situationFilters';
import { RainCanvas } from '@/components/RainCanvas';
import { shareLink } from '@/utils/share';
import { venueUrl } from '@/utils/slug';
import { canonicalType } from '@/utils/venueTypes';
import type { RouteProps, Venue } from '@/types';
import styles from './SwipePage.module.css';

/*
 * The Drip Feed.
 *
 * Everything here is CSS scroll-snap: no gesture handler, no drag maths, so the
 * fling and the rubber-banding are the platform's own and feel native for free.
 * scroll-snap-stop: always is what makes one swipe advance exactly one card
 * however hard you throw it, so it behaves like a deck rather than a list.
 *
 * No imagery. Type on a monochrome ground, which costs nothing per card, where a
 * Google photo costs a request against a capped budget and makes every snap wait
 * on a network round trip.
 */

const PAGE_SIZE = 10;

/** Four at most: five pills wrap to a second line on a 375px card. */
const MAX_PILLS = 4;

/*
 * Greys, blacks and whites. Every tone carries its own ink, because white rain
 * and white type are invisible on an off-white card, so a light card is a full
 * inversion rather than just a lighter background.
 *
 * Checked rather than eyeballed. Against its own ground each tone clears 4.5:1
 * for the body text at 82% opacity and 3:1 for the small uppercase label at
 * 55%. The tightest is mid grey at 5.8:1 and 3.6:1.
 */
interface CardTone {
  bg: string;
  ink: string;
  /** Rain colour as an "r, g, b" triple, matching the ink. */
  rain: string;
}

const TONES: CardTone[] = [
  { bg: '#000000', ink: '#ffffff', rain: '255, 255, 255' },
  { bg: '#f4f3ee', ink: '#0d0f12', rain: '13, 15, 18' },
  { bg: '#3a3f47', ink: '#ffffff', rain: '255, 255, 255' },
  { bg: '#16181c', ink: '#ffffff', rain: '255, 255, 255' },
  { bg: '#d7d7d2', ink: '#0d0f12', rain: '13, 15, 18' },
  { bg: '#4e545b', ink: '#ffffff', rain: '255, 255, 255' },
];

/*
 * Four downpours, cycled by position so no two adjacent cards get the same
 * weather. Hashing the venue name was the first attempt and it clustered badly:
 * across the first ten it dealt four downpours, four steadies, two drivings and
 * not one drizzle, so a whole variant went unseen.
 *
 * Six tones against four downpours means the pairing does not repeat for twelve
 * cards, which is further than anyone scrolls in one sitting.
 */
const RAIN = [
  { density: 1.8, alpha: 1.8, wind: 0.5 },    // drizzle, drifting
  { density: 3.2, alpha: 2.2, wind: 0.25 },   // steady, near vertical
  { density: 4.2, alpha: 2.4, wind: 1.4 },    // driving, hard lean
  { density: 6.0, alpha: 2.6, wind: -0.7 },   // downpour, blowing back
];

/**
 * Every venue, ordered so consecutive cards are different categories all the way
 * down rather than only for the first ten.
 *
 * Group by category, best rated first within each, then deal round-robin across
 * the groups. The earlier version took one venue per category and then dumped
 * the remainder in table order, which was fine for a ten-card prototype and
 * falls apart the moment there is a Load more button underneath it.
 */
function interleaveByCategory(all: Venue[]): Venue[] {
  const groups = new Map<string, Venue[]>();

  for (const v of all) {
    const key = canonicalType(v.type?.[0] ?? 'other');
    const group = groups.get(key);
    if (group) group.push(v);
    else groups.set(key, [v]);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  // Biggest decks first, so the long tail does not all bunch up at the end.
  const decks = [...groups.values()].sort((a, b) => b.length - a.length);
  const out: Venue[] = [];

  for (let round = 0; ; round += 1) {
    let dealt = false;
    for (const deck of decks) {
      const v = deck[round];
      if (!v) continue;
      out.push(v);
      dealt = true;
    }
    if (!dealt) break;
  }

  return out;
}

/** Up to the first full stop. The card clamps to three lines regardless. */
function openingLine(description: string | undefined): string {
  const d = (description ?? '').trim();
  const cut = d.indexOf('. ');
  return cut === -1 ? d : d.slice(0, cut + 1);
}

const LABELS: Record<string, string> = Object.fromEntries(
  SITUATIONS.map((s) => [s.value, s.label]),
);

interface SwipeCardProps {
  venue: Venue;
  index: number;
  hint: boolean;
  /** Rain is mounted for the card in view and its neighbours only. */
  wet: boolean;
}

function SwipeCard({ venue, index, hint, wet }: SwipeCardProps) {
  const score = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));
  const band = wetnessBand(score);
  const goodFor = situationsFor(venue).slice(0, MAX_PILLS);
  const tone = TONES[index % TONES.length];

  return (
    <li className={styles.slot} data-index={index}>
      <article
        className={styles.face}
        style={{ '--card-bg': tone.bg, '--card-ink': tone.ink }}
      >
        {wet && <RainCanvas rgb={tone.rain} {...RAIN[index % RAIN.length]} />}

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

          {goodFor.length > 0 && (
            <div className={styles.goodFor}>
              <p className={styles.goodForLabel}>Good for</p>
              <ul className={styles.pills}>
                {goodFor.map((sit) => (
                  <li key={sit} className={styles.pill}>{LABELS[sit]}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/*
          * Shares the venue's own page, not /swipe. Whoever receives it should
          * land on the thing being recommended, and that page is prerendered so
          * a shared link is also a link Google can follow.
          */}
        <button
          type="button"
          className={styles.share}
          onClick={() => shareLink({
            title: venue.name,
            text: `${venue.name} - ${band.label.toLowerCase()}, on Wet London`,
            url: venueUrl(venue),
          })}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12M12 3 8 7M12 3l4 4" />
            <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
          </svg>
          Share
        </button>

        {hint && <p className={styles.hint} aria-hidden="true">Swipe for the next</p>}
      </article>
    </li>
  );
}

export function SwipePage(_props: RouteProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const [active, setActive] = useState(0);
  const feedRef = useRef<HTMLUListElement>(null);

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

  const ordered = interleaveByCategory(venues.value);
  const cards = ordered.slice(0, shown);
  const more = ordered.length - cards.length;

  /*
   * Which card is in view, so rain is mounted for that one and its neighbours
   * only.
   *
   * A canvas sizes its backing store whether or not it is drawing, so ten
   * mounted at once held roughly 45MB at dpr 2. With a Load more button under
   * them that grows without limit, and a hundred cards would be around 450MB,
   * which is a phone dropping the tab. This costs one re-render per card change
   * rather than per pixel of scroll, and the neighbour is always mounted before
   * anybody reaches it.
   */
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { root: feed, threshold: 0.6 },
    );

    for (const slot of Array.from(feed.children)) {
      if ((slot as HTMLElement).dataset.index !== undefined) io.observe(slot);
    }
    return () => io.disconnect();
  }, [cards.length]);

  /* The close button lives on the layer, so the layer needs the tone too. */
  const activeTone = TONES[active % TONES.length];

  return (
    <div
      className={styles.layer}
      style={{ '--card-bg': activeTone.bg, '--card-ink': activeTone.ink }}
    >
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
        <ul ref={feedRef} className={styles.feed} tabIndex={0} aria-label="Activities, one per screen">
          {cards.map((v, i) => (
            <SwipeCard
              key={`${v.name}-${i}`}
              venue={v}
              index={i}
              hint={i === 0}
              wet={Math.abs(i - active) <= 1}
            />
          ))}

          {more > 0 && (
            <li className={styles.slot}>
              <div className={styles.endFace}>
                <p className={styles.endCount}>{cards.length} of {ordered.length}</p>
                <p className={styles.endTitle}>Still raining.</p>
                <button
                  type="button"
                  className={styles.loadMore}
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                >
                  Ten more
                </button>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
