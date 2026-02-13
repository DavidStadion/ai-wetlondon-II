import { ActivityCard } from '@/components/ActivityCard';
import { highlightedVenues, isLoading } from '@/signals/venueSignals';
import { hasActiveFilters } from '@/signals/filterSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import type { Venue } from '@/types';
import styles from './TopPicksSection.module.css';

export function TopPicksSection() {
  const picks = highlightedVenues.value;

  if (isLoading.value || hasActiveFilters.value || picks.length === 0) {
    return null;
  }

  const handleCardClick = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Dave and Kate's Top 3.</h2>
      <p className={styles.subtitle}>Three venues I'm backing right now</p>
      <div className={styles.grid}>
        {picks.map((venue) => (
          <ActivityCard
            key={venue.name}
            venue={venue}
            variant="default"
            onClick={() => handleCardClick(venue)}
          />
        ))}
      </div>
    </section>
  );
}
