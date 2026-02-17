import { signal } from '@preact/signals';
import { Tag } from '@/components/common/Tag';
import { selectedTypes, toggleType, clearAllFilters, filterCounts } from '@/signals/filterSignals';
import { venues } from '@/signals/venueSignals';
import type { VenueType } from '@/types';
import styles from './FilterChips.module.css';

const isExpanded = signal(false);

const ACTIVITY_TYPES: { value: VenueType; label: string }[] = [
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

function getTypeCounts(): Partial<Record<VenueType, number>> {
  const counts: Partial<Record<VenueType, number>> = {};
  for (const venue of venues.value) {
    for (const t of venue.type) {
      counts[t] = (counts[t] ?? 0) + 1;
    }
  }
  return counts;
}

export function FilterChips() {
  const selected = selectedTypes.value;
  const count = filterCounts.value.types;
  const expanded = isExpanded.value;
  const typeCounts = getTypeCounts();

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.header}
        onClick={() => { isExpanded.value = !isExpanded.value; }}
      >
        <span className={styles.label}>Filter by Category</span>
        {count > 0 && (
          <span className={styles.badge}>{count}</span>
        )}
        <span className={styles.toggle}>{expanded ? 'Hide' : 'Show'} &rsaquo;</span>
      </button>

      {expanded && (
        <>
          <div className={styles.chips}>
            {ACTIVITY_TYPES.map(({ value, label }) => {
              const typeCount = typeCounts[value] ?? 0;
              return (
                <Tag
                  key={value}
                  label={`${label} (${typeCount})`}
                  selected={selected.has(value)}
                  onClick={() => toggleType(value)}
                />
              );
            })}
          </div>
          {count > 0 && (
            <button type="button" className={styles.clearAll} onClick={clearAllFilters}>
              Clear All
            </button>
          )}
        </>
      )}
    </div>
  );
}
