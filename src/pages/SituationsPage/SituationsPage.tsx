import { useEffect, useCallback } from 'preact/hooks';
import { signal, computed } from '@preact/signals';
import { venues, isLoading } from '@/signals/venueSignals';
import {
  selectedVenue,
  isActivityModalOpen,
  loadBookmarks,
  loadRecentlyViewed,
} from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import type { Venue, RouteProps } from '@/types';
import type { Situation } from '@/utils/situationFilters';
import {
  SITUATIONS,
  filterForSituation,
} from '@/utils/situationFilters';
import { ActivityCard } from '@/components/ActivityCard';
import { ClubBand } from '@/components/ClubBand';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import styles from './SituationsPage.module.css';

const PAGE_SIZE = 9;

// Local signals for this page
const currentSituation = signal<Situation | null>(null);
const shownCount = signal<number>(PAGE_SIZE);

const filteredResults = computed(() => {
  return filterForSituation(currentSituation.value, venues.value);
});

const visibleResults = computed(() => {
  return filteredResults.value.slice(0, shownCount.value);
});

const situationCounts = computed(() => {
  const counts: Partial<Record<Situation, number>> = {};
  SITUATIONS.forEach(({ value }) => {
    counts[value] = filterForSituation(value, venues.value).length;
  });
  return counts;
});

function openActivityModal(venue: Venue) {
  selectedVenue.value = venue;
  isActivityModalOpen.value = true;
}

function closeActivityModal() {
  isActivityModalOpen.value = false;
}

export function SituationsPage(_props: RouteProps) {
  useEffect(() => {
    loadBookmarks();
    loadRecentlyViewed();

    async function loadVenues() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      try {
        const data = await fetchVenues();
        venues.value = data;
      } catch {
        // Silent fail, UI shows empty state
      } finally {
        isLoading.value = false;
      }
    }

    loadVenues();
  }, []);

  const selectSituation = useCallback((sit: Situation) => {
    currentSituation.value = sit;
    shownCount.value = PAGE_SIZE;
    document.querySelector(`.${styles.results}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const clearSituation = useCallback(() => {
    currentSituation.value = null;
    shownCount.value = PAGE_SIZE;
  }, []);

  const loadMore = useCallback(() => {
    shownCount.value += PAGE_SIZE;
  }, []);

  const loading = isLoading.value;
  const situation = currentSituation.value;
  const results = visibleResults.value;
  const totalResults = filteredResults.value.length;
  const counts = situationCounts.value;
  const hasMore = shownCount.value < totalResults;

  const title = situation
    ? `${situation.charAt(0).toUpperCase() + situation.slice(1)} ideas`
    : 'Popular picks';

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Pick Your Vibe</h1>
          <p className={styles.tagline}>
            Filter activities by the kind of day you're having. No judgement. Minimal walking. Maximum dryness.
          </p>

          <div className={styles.controls}>
            <h2 className={styles.controlsTitle}>Who are you with?</h2>
            <p className={styles.controlsHelper}>Tap a chip to narrow things down. You can still browse everything.</p>

            <div className={styles.chips}>
              {SITUATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.chip} ${situation === value ? styles.active : ''}`}
                  onClick={() => selectSituation(value)}
                >
                  {label} ({counts[value] ?? 0})
                </button>
              ))}
            </div>

            {situation && (
              <div className={styles.activeFilter} aria-live="polite">
                <span className={styles.filterLabel}>
                  Filtered for: <strong>{situation.charAt(0).toUpperCase() + situation.slice(1)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className={styles.results}>
        <div className={styles.container}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>{title}</h2>
            {situation && (
              <button type="button" className={styles.clearBtn} onClick={clearSituation}>
                Clear
              </button>
            )}
          </div>

          {loading && <LoadingSpinner text="Loading activities..." />}

          {!loading && results.length === 0 && (
            <div className={styles.emptyState}>
              <h3>Nothing matched that vibe</h3>
              <p>Try another chip, or jump back to All Activities and browse the lot.</p>
              <Button as="a" href="/#all-activities">Browse everything</Button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className={styles.grid}>
                {results.map((venue) => (
                  <ActivityCard
                    key={venue.name}
                    venue={venue}
                    variant="default"
                    onClick={() => openActivityModal(venue)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className={styles.loadMore}>
                  <Button variant="secondary" onClick={loadMore}>Load more</Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ClubBand source="situations" />

      <BackToTop />

      {/* Activity Modal */}
      <ActivityModal
        venue={selectedVenue.value}
        isOpen={isActivityModalOpen.value}
        onClose={closeActivityModal}
      />
    </div>
  );
}
