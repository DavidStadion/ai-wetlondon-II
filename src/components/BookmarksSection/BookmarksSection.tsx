import { computed } from '@preact/signals';
import { useState } from 'preact/hooks';
import { ActivityCard } from '@/components/ActivityCard';
import { bookmarkedVenues, selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { venues } from '@/signals/venueSignals';
import type { Venue } from '@/types';
import styles from './BookmarksSection.module.css';

const bookmarkedVenuesList = computed(() => {
  const bookmarks = bookmarkedVenues.value;
  return venues.value.filter((v) => bookmarks.has(v.name));
});

export function BookmarksSection() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const venuesList = bookmarkedVenuesList.value;

  const handleCardClick = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  if (venuesList.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Your Bookmarks</h2>
        <p className={styles.empty}>No bookmarks yet. Save activities to find them here.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Bookmarks ({venuesList.length})</h2>
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
