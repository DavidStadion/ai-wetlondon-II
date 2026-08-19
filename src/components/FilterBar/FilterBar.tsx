import { computed, signal } from '@preact/signals';
import { venues, sortOption } from '@/signals/venueSignals';
import type { SortOption } from '@/signals/venueSignals';
import {
  selectedTypes,
  selectedAreas,
  maxWetnessScore,
  maxPrice,
  openNow,
  toggleType,
  toggleArea,
  hasActiveFilters,
  clearAllFilters,
} from '@/signals/filterSignals';
import type { VenueType, AreaType } from '@/types';
import { WETNESS_BANDS } from '@/utils/wetness';
import styles from './FilterBar.module.css';

const AREAS: Array<{ value: AreaType; label: string }> = [
  { value: 'central', label: 'Central' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

const PRICES: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Any price' },
  { value: 0, label: 'Free' },
  { value: 10, label: 'Under £10' },
  { value: 20, label: 'Under £20' },
];

const WETNESS: Array<{ value: number; label: string }> = [
  { value: 100, label: 'Any' },
  { value: WETNESS_BANDS[0].max, label: WETNESS_BANDS[0].label },
  { value: 40, label: 'Mostly dry' },
];

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'wetness-asc', label: 'Driest first' },
  { value: 'price-asc', label: 'Cheapest first' },
  { value: 'price-desc', label: 'Priciest first' },
  { value: 'name-desc', label: 'Name (Z to A)' },
  { value: 'random', label: 'Surprise me' },
];

/** Curated labels, friendlier than the raw type keys in the database. */
const ACTIVITY_TYPES: Array<{ value: VenueType; label: string }> = [
  { value: 'museums', label: 'Museums' },
  { value: 'galleries', label: 'Galleries' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'music', label: 'Music Venues' },
  { value: 'comedy', label: 'Comedy Clubs' },
  { value: 'cinema', label: 'Cinemas' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'workshops', label: 'Classes & Workshops' },
  { value: 'historic', label: 'Historic Sites' },
  { value: 'markets', label: 'Markets' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'exhibitions', label: 'Exhibitions' },
  { value: 'libraries', label: 'Libraries' },
];

/**
 * Open by default, and collapsible for space. Module level rather than local
 * state so the choice survives a re-render and sticks while you page through
 * results, but resets to open on a fresh visit.
 */
const isOpen = signal(true);

/**
 * How many of this bar's own filters are on. Counted here rather than reusing
 * hasActiveFilters because this is the number the collapsed header shows, and a
 * panel you cannot see needs to be honest about what it is still doing.
 */
const activeCount = computed(() =>
  selectedTypes.value.size +
  selectedAreas.value.size +
  (maxPrice.value !== null ? 1 : 0) +
  (maxWetnessScore.value < 100 ? 1 : 0) +
  (openNow.value ? 1 : 0),
);

/** Counts come from the live data, so an empty category simply disappears. */
const categories = computed(() => {
  const counts = new Map<string, number>();
  venues.value.forEach((v) => {
    v.type.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  });

  return ACTIVITY_TYPES
    .map((t) => ({ ...t, count: counts.get(t.value) ?? 0 }))
    .filter((t) => t.count > 0);
});

export function FilterBar() {
  const cats = categories.value;
  const active = hasActiveFilters.value;
  const open = isOpen.value;
  const onCount = activeCount.value;

  if (cats.length === 0) return null;

  return (
    <section className={styles.bar} aria-label="Filter activities">
      <div className={styles.head}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="filterPanel"
          onClick={() => { isOpen.value = !open; }}
        >
          <svg
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.title}>Filter by category</span>
          {/* Only when hidden: while the panel is open the chips say it themselves. */}
          {!open && onCount > 0 && (
            <span className={styles.badge}>
              {onCount} on
            </span>
          )}
          <span className={styles.toggleHint}>{open ? 'Hide' : 'Show'}</span>
        </button>
        <div className={styles.sortWrap}>
          <label className={styles.sortLabel} htmlFor="sortBy">Sort by</label>
          <select
            id="sortBy"
            className={styles.sortSelect}
            value={sortOption.value}
            onChange={(e) => { sortOption.value = (e.target as HTMLSelectElement).value as SortOption; }}
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div id="filterPanel" className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        <div className={styles.panelInner}>
          <div className={styles.row}>
            {cats.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`${styles.chip} ${selectedTypes.value.has(c.value) ? styles.on : ''}`}
                aria-pressed={selectedTypes.value.has(c.value)}
                onClick={() => toggleType(c.value)}
              >
                {c.label} <span className={styles.count}>{c.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.groups}>
            <div className={styles.group}>
              <span className={styles.groupLabel}>Where</span>
              <div className={styles.row}>
                {AREAS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={`${styles.chip} ${selectedAreas.value.has(a.value) ? styles.on : ''}`}
                    aria-pressed={selectedAreas.value.has(a.value)}
                    onClick={() => toggleArea(a.value)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Price</span>
              <div className={styles.row}>
                {PRICES.map((p) => (
                  <button
                    key={String(p.value)}
                    type="button"
                    className={`${styles.chip} ${maxPrice.value === p.value ? styles.on : ''}`}
                    aria-pressed={maxPrice.value === p.value}
                    onClick={() => { maxPrice.value = p.value; }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>How dry</span>
              <div className={styles.row}>
                {WETNESS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    className={`${styles.chip} ${maxWetnessScore.value === w.value ? styles.on : ''}`}
                    aria-pressed={maxWetnessScore.value === w.value}
                    onClick={() => { maxWetnessScore.value = w.value; }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Right now</span>
              <div className={styles.row}>
                <button
                  type="button"
                  className={`${styles.chip} ${openNow.value ? styles.on : ''}`}
                  aria-pressed={openNow.value}
                  onClick={() => { openNow.value = !openNow.value; }}
                >
                  Open now
                </button>
                {active && (
                  <button type="button" className={styles.clear} onClick={clearAllFilters}>
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
