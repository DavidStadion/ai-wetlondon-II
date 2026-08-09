import { computed } from '@preact/signals';
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
  { value: 10, label: 'Bone dry' },
  { value: 40, label: 'Mostly dry' },
];

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'wetness-asc', label: 'Driest first' },
  { value: 'price-asc', label: 'Cheapest first' },
  { value: 'price-desc', label: 'Priciest first' },
  { value: 'name-desc', label: 'Name (Z–A)' },
];

/** Categories present in the data, most common first — no hardcoded guesses. */
const categories = computed<Array<{ value: VenueType; label: string; count: number }>>(() => {
  const counts = new Map<string, number>();
  venues.value.forEach((v) => {
    v.type.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  });

  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([value, count]) => ({
      value: value as VenueType,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      count,
    }));
});

export function FilterBar() {
  const cats = categories.value;
  const active = hasActiveFilters.value;

  if (cats.length === 0) return null;

  return (
    <section className={styles.bar} aria-label="Filter activities">
      <div className={styles.head}>
        <h2 className={styles.title}>Filter by category</h2>
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
    </section>
  );
}
