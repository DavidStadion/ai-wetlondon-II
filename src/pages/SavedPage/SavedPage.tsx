import { useEffect } from 'preact/hooks';
import { computed } from '@preact/signals';
import { venues, isLoading } from '@/signals/venueSignals';
import {
  bookmarkedVenues,
  clearAllBookmarks,
  loadBookmarks,
  selectedVenue,
  isActivityModalOpen,
} from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, RouteProps } from '@/types';
import styles from './SavedPage.module.css';

const savedVenues = computed(() => {
  const saved = bookmarkedVenues.value;
  return venues.value.filter((v) => saved.has(v.name));
});

/** Names the user saved that are no longer in the venue list (removed/renamed). */
const orphanedCount = computed(() => {
  const known = new Set(venues.value.map((v) => v.name));
  return [...bookmarkedVenues.value].filter((n) => !known.has(n)).length;
});

export function SavedPage(_props: RouteProps) {
  useEffect(() => {
    loadBookmarks();

    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      try {
        venues.value = await fetchVenues();
      } catch {
        // Empty state covers it
      } finally {
        isLoading.value = false;
      }
    }

    load();
  }, []);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(selected?.name ?? '', selected?.type ?? []);

  const list = savedVenues.value;
  const loading = isLoading.value;
  const orphans = orphanedCount.value;

  const openVenue = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Your saved places</h1>
        <p className={styles.tagline}>
          {list.length > 0
            ? `${list.length} ${list.length === 1 ? 'place' : 'places'} waiting for the next downpour.`
            : 'Tap "Save it" on anything you like the look of and it will land here.'}
        </p>
      </section>

      <section className={styles.container}>
        {loading && <LoadingSpinner text="Loading your saved places..." />}

        {!loading && list.length === 0 && (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Nothing saved yet</h2>
            <p className={styles.emptyText}>
              Browse the good stuff and hit <strong>Save it</strong> on anything you fancy.
              We'll keep it here on this device.
            </p>
            <div className={styles.emptyActions}>
              <Button as="a" href="/all-activities" variant="accent">Browse all activities</Button>
              <Button as="a" href="/situations" variant="secondary">Pick your vibe</Button>
            </div>
          </div>
        )}

        {!loading && list.length > 0 && (
          <>
            <div className={styles.toolbar}>
              <span className={styles.count}>
                {list.length} saved
                {orphans > 0 && ` · ${orphans} no longer listed`}
              </span>
              <button type="button" className={styles.clearBtn} onClick={clearAllBookmarks}>
                Clear all
              </button>
            </div>

            <div className={styles.grid}>
              {list.map((venue) => (
                <ActivityCard
                  key={venue.name}
                  venue={venue}
                  onClick={() => openVenue(venue)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <BackToTop />

      <ActivityModal
        venue={selectedVenue.value}
        isOpen={isActivityModalOpen.value}
        onClose={() => { isActivityModalOpen.value = false; }}
        imageUrl={modalImageUrl}
      />
    </div>
  );
}
