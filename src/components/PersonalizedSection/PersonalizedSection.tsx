import { useEffect, useRef } from 'preact/hooks';
import { signal } from '@preact/signals';
import { filteredVenues, venueCount } from '@/signals/venueSignals';
import { clearAllFilters } from '@/signals/filterSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { ActivityCard } from '@/components/ActivityCard';
import type { Venue, CardVariant } from '@/types';
import styles from './PersonalizedSection.module.css';

const INITIAL_COUNT = 6;
const expanded = signal(false);

function getCardVariant(venue: Venue): CardVariant {
  if (venue.spotlight) return 'spotlight';
  if (venue.featured) return 'featured';
  if (venue.sponsored) return 'sponsored';
  return 'default';
}

function openActivityModal(venue: Venue) {
  selectedVenue.value = venue;
  isActivityModalOpen.value = true;
}

export function PersonalizedSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const venues = filteredVenues.value;
  const count = venueCount.value;
  const visible = expanded.value ? venues : venues.slice(0, INITIAL_COUNT);
  const hasMore = !expanded.value && venues.length > INITIAL_COUNT;

  useEffect(() => {
    expanded.value = false;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div ref={sectionRef} className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Your Personalized Selection</h2>
          <span className={styles.count}>
            {count} {count === 1 ? 'activity' : 'activities'} found
          </span>
        </div>
        <button type="button" className={styles.closeBtn} onClick={clearAllFilters} aria-label="Clear filters">
          &times;
        </button>
      </div>

      {visible.length > 0 && (
        <div className={styles.grid}>
          {visible.map((venue, index) => (
            <ActivityCard
              key={`personalized-${venue.name}-${index}`}
              venue={venue}
              variant={getCardVariant(venue)}
              onClick={() => openActivityModal(venue)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <button type="button" className={styles.loadMore} onClick={() => { expanded.value = true; }}>
            Show All ({venues.length - INITIAL_COUNT} more)
          </button>
        </div>
      )}

      {venues.length === 0 && (
        <p className={styles.emptyText}>No activities match your filters.</p>
      )}
    </div>
  );
}
