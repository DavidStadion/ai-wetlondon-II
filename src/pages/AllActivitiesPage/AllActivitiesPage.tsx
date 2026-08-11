import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  venues,
  filteredVenues,
  venueCount,
  totalActivities,
  openNowCount,
  freeEntryCount,
  isLoading,
  error,
} from '@/signals/venueSignals';
import { hasActiveFilters, clearAllFilters } from '@/signals/filterSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { useImageLoader } from '@/hooks/useImageLoader';
import { ActivityCard } from '@/components/ActivityCard';
import { ClubBand } from '@/components/ClubBand';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { FilterBar } from '@/components/FilterBar';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { AdSlot } from '@/components/common/AdSlot';
import type { Venue, CardVariant, RouteProps } from '@/types';
import styles from './AllActivitiesPage.module.css';

const PAGE_SIZE = 24;
/** Break the grid with a promo/ad after this many cards. */
const PROMO_EVERY = 12;

const shown = signal(PAGE_SIZE);

function getCardVariant(venue: Venue): CardVariant {
  if (venue.spotlight) return 'spotlight';
  if (venue.featured) return 'featured';
  if (venue.sponsored) return 'sponsored';
  return 'default';
}

export function AllActivitiesPage(_props: RouteProps) {
  useEffect(() => {
    shown.value = PAGE_SIZE;

    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      error.value = null;
      try {
        venues.value = await fetchVenues();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load venues';
      } finally {
        isLoading.value = false;
      }
    }
    load();
  }, []);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(selected?.name ?? '', selected?.type ?? []);

  const loading = isLoading.value;
  const errorMsg = error.value;
  const results = filteredVenues.value;
  const filtersActive = hasActiveFilters.value;

  const visible = results.slice(0, shown.value);
  const hasMore = results.length > shown.value;

  const openVenue = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  // Split the visible cards into blocks so promos can sit between them
  const blocks: Venue[][] = [];
  for (let i = 0; i < visible.length; i += PROMO_EVERY) {
    blocks.push(visible.slice(i, i + PROMO_EVERY));
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>All Activities</h1>
        <p className={styles.tagline}>
          Every indoor place we've found in London, rated by how dry you'll stay.
          Filter it down to whatever kind of day you're having.
        </p>
      </header>

      <section className={styles.container}>
        {!loading && !errorMsg && (
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalActivities.value}</span>
              <span className={styles.statLabel}>Places listed</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statNumberGreen}`}>{openNowCount.value}</span>
              <span className={styles.statLabel}>Open right now</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statNumberBlue}`}>{freeEntryCount.value}</span>
              <span className={styles.statLabel}>Free to enter</span>
            </div>
          </div>
        )}

        <FilterBar />

        {!loading && !errorMsg && (
          <div className={styles.resultsBar} aria-live="polite">
            <span className={styles.resultsCount}>
              {filtersActive
                ? `${venueCount.value} of ${totalActivities.value} places match`
                : `${totalActivities.value} places`}
            </span>
            {filtersActive && (
              <button type="button" className={styles.clearBtn} onClick={clearAllFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <SkeletonLoader variant="card" height="240px" />
              </div>
            ))}
          </div>
        )}

        {!loading && errorMsg && (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{errorMsg}</p>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        )}

        {!loading && !errorMsg && results.length === 0 && (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Nothing matches that</h2>
            <p className={styles.emptyText}>
              Try loosening a filter, or clear them and start again.
            </p>
            <Button onClick={clearAllFilters} variant="accent">Clear all filters</Button>
          </div>
        )}

        {!loading && !errorMsg && blocks.map((block, blockIndex) => (
          <div key={`block-${blockIndex}`}>
            <div className={styles.grid}>
              {block.map((venue, index) => (
                <ActivityCard
                  key={`${venue.name}-${index}`}
                  venue={venue}
                  variant={getCardVariant(venue)}
                  onClick={() => openVenue(venue)}
                />
              ))}
            </div>

            {/* Alternate promo and advertising between blocks, never at the very end */}
            {blockIndex < blocks.length - 1 && (
              blockIndex % 2 === 0 ? (
                <ClubBand source="all-activities" />
              ) : (
                <div className={styles.adWrap}>
                  {/* AdSense unit "All activities in-feed" */}
                  <AdSlot slotId="1639783634" format="horizontal" />
                </div>
              )
            )}
          </div>
        ))}

        {!loading && hasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMore}
              onClick={() => { shown.value += PAGE_SIZE; }}
            >
              Load more ({results.length - shown.value} remaining)
            </button>
          </div>
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
