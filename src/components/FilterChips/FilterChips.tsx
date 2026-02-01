import { Tag } from '@/components/common/Tag';
import { selectedTypes, toggleType, filterCounts } from '@/signals/filterSignals';
import type { VenueType } from '@/types';
import styles from './FilterChips.module.css';

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

export function FilterChips() {
  const selected = selectedTypes.value;
  const count = filterCounts.value.types;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Activity Types</span>
        {count > 0 && (
          <span className={styles.badge}>{count}</span>
        )}
      </div>
      <div className={styles.chips}>
        {ACTIVITY_TYPES.map(({ value, label }) => (
          <Tag
            key={value}
            label={label}
            selected={selected.has(value)}
            onClick={() => toggleType(value)}
          />
        ))}
      </div>
    </div>
  );
}
