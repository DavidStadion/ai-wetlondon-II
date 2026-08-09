import { computed } from '@preact/signals';
import { ActivityCard } from '@/components/ActivityCard';
import { bookmarkedVenues, clearAllBookmarks, selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { venues } from '@/signals/venueSignals';
import type { Venue } from '@/types';
import styles from './BookmarksSection.module.css';

const bookmarkedVenuesList = computed(() => {
  const bookmarks = bookmarkedVenues.value;
  return venues.value.filter((v) => bookmarks.has(v.name));
});

export function BookmarksSection() {
  const venuesList = bookmarkedVenuesList.value;
  const count = venuesList.length;

  const handleCardClick = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  return (
    <section className={styles.section} id="bookmarks">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Saved places</h2>
          <span className={styles.count}>
            {count} bookmarked {count === 1 ? 'activity' : 'activities'}
          </span>
        </div>
        {count > 0 && (
          <button type="button" className={styles.clearBtn} onClick={clearAllBookmarks}>
            Clear All Bookmarks
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {count === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No bookmarks yet</h3>
            <p className={styles.emptyText}>Start bookmarking activities to see them here!</p>
          </div>
        ) : (
          venuesList.map((venue) => (
            <ActivityCard key={venue.name} venue={venue} onClick={() => handleCardClick(venue)} />
          ))
        )}
      </div>
    </section>
  );
}
