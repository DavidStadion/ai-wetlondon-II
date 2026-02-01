import { computed } from '@preact/signals';
import { useState } from 'preact/hooks';
import { ActivityCard } from '@/components/ActivityCard';
import { recentlyViewed, selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { venues } from '@/signals/venueSignals';
import type { Venue } from '@/types';
import styles from './RecentlyViewedSection.module.css';

const recentlyViewedVenues = computed(() => {
  const recent = recentlyViewed.value.slice(0, 10);
  const venueMap = new Map(venues.value.map((v) => [v.name, v]));
  return recent.map((name) => venueMap.get(name)).filter(Boolean) as Venue[];
});

export function RecentlyViewedSection() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const venuesList = recentlyViewedVenues.value;

  const handleCardClick = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  if (venuesList.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Recently Viewed</h2>
        <p className={styles.empty}>No recently viewed activities. Browse around to see them here.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recently Viewed ({venuesList.length})</h2>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.scrollContainer}>
          <div className={styles.cards}>
            {venuesList.map((venue) => (
              <div key={venue.name} className={styles.cardWrapper}>
                <ActivityCard venue={venue} onClick={() => handleCardClick(venue)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
