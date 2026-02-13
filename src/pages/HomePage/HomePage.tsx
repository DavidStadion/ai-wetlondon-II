import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  venues,
  filteredVenues,
  isLoading,
  error,
  totalActivities,
  openNowCount,
  freeEntryCount,
  sortOption,
} from '@/signals/venueSignals';
import type { SortOption } from '@/signals/venueSignals';
import { hasActiveFilters, clearAllFilters } from '@/signals/filterSignals';
import {
  loadBookmarks,
  loadRecentlyViewed,
  selectedVenue,
  isActivityModalOpen,
  isCustomizeModalOpen,
} from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, CardVariant, RouteProps } from '@/types';

import { Hero } from '@/components/Hero';
import { QuickFilters } from '@/components/QuickFilters';
import { PopularCategories } from '@/components/PopularCategories';
import { FilterChips } from '@/components/FilterChips';
import { ActivityCard } from '@/components/ActivityCard';
import { BookmarksSection } from '@/components/BookmarksSection';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { WeatherRecommendations } from '@/components/WeatherRecommendations';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Button } from '@/components/common/Button';

import { ActivityModal } from '@/components/modals/ActivityModal';
import { CustomizeModal } from '@/components/modals/CustomizeModal';
import { PrerequisitesModal } from '@/components/modals/PrerequisitesModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { BookingModal } from '@/components/modals/BookingModal';

import styles from './HomePage.module.css';

const PAGE_SIZE = 6;
const displayedCount = signal(PAGE_SIZE);

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

function closeActivityModal() {
  isActivityModalOpen.value = false;
}

function openCustomizeModal() {
  isCustomizeModalOpen.value = true;
}

function handleFeelingLucky() {
  const venueList = venues.value;
  if (venueList.length > 0) {
    const randomIndex = Math.floor(Math.random() * venueList.length);
    openActivityModal(venueList[randomIndex]);
  }
}

function handleLoadMore() {
  displayedCount.value += PAGE_SIZE;
}

function handleSortChange(e: Event) {
  sortOption.value = (e.target as HTMLSelectElement).value as SortOption;
  displayedCount.value = PAGE_SIZE;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price (Low-High)' },
  { value: 'price-desc', label: 'Price (High-Low)' },
  { value: 'wetness-asc', label: 'Wetness (Driest)' },
  { value: 'wetness-desc', label: 'Wetness (Wettest)' },
];

export function HomePage(_props: RouteProps) {
  useEffect(() => {
    loadBookmarks();
    loadRecentlyViewed();

    async function loadVenues() {
      isLoading.value = true;
      error.value = null;
      try {
        const data = await fetchVenues();
        venues.value = data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load venues';
      } finally {
        isLoading.value = false;
      }
    }

    loadVenues();
  }, []);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(
    selected?.name ?? '',
    selected?.type ?? []
  );

  const loading = isLoading.value;
  const errorMsg = error.value;
  const venueList = filteredVenues.value;
  const filtersActive = hasActiveFilters.value;

  // Reset pagination when filters change
  useEffect(() => {
    displayedCount.value = PAGE_SIZE;
  }, [venueList]);

  // Split spotlight + featured venues (matching old version logic)
  const spotlightVenue = venueList.find((v) => v.spotlight) ?? null;
  const featuredVenues = venueList
    .filter((v) => v.featured && v.name !== spotlightVenue?.name)
    .slice(0, 6);
  const regularVenues = venueList;

  // Paginate regular venues
  const visibleRegular = regularVenues.slice(0, displayedCount.value);
  const hasMore = regularVenues.length > displayedCount.value;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <Hero onCustomize={openCustomizeModal} onFeelingLucky={handleFeelingLucky} />

      {/* Quick Filter Pills */}
      <QuickFilters />

      {/* Popular Categories */}
      <PopularCategories />

      {/* Featured Activities Section */}
      {!loading && !errorMsg && (spotlightVenue || featuredVenues.length > 0) && !filtersActive && (
        <section className={styles.featured}>
          <h2 className={styles.sectionTitle}>Featured Activities</h2>
          {spotlightVenue && (
            <div className={styles.spotlightWrapper}>
              <ActivityCard
                venue={spotlightVenue}
                variant="spotlightHero"
                onClick={() => openActivityModal(spotlightVenue)}
              />
            </div>
          )}
          {featuredVenues.length > 0 && (
            <div className={styles.grid}>
              {featuredVenues.map((venue, index) => (
                <ActivityCard
                  key={`featured-${venue.name}-${index}`}
                  venue={venue}
                  variant="featured"
                  onClick={() => openActivityModal(venue)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Weather Recommendations */}
      {!loading && !errorMsg && !filtersActive && (
        <WeatherRecommendations />
      )}

      {/* Main Content - All Activities */}
      <section className={styles.content}>
        {/* Bookmarks Section */}
        <BookmarksSection />

        {/* Recently Viewed Section */}
        <RecentlyViewedSection />

        {/* All Activities Header */}
        <div className={styles.allActivitiesHeader}>
          <h2 className={styles.sectionTitle}>All Activities</h2>
          {!loading && (
            <p className={styles.subtitle}>
              Explore all {totalActivities.value}+ indoor activities across London
            </p>
          )}
        </div>

        {/* Stats Bar */}
        {!loading && !errorMsg && (
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalActivities.value}</span>
              <span className={styles.statLabel}>Total Activities</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statNumberGreen}`}>{openNowCount.value}</span>
              <span className={styles.statLabel}>Open Now</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statNumberBlue}`}>{freeEntryCount.value}</span>
              <span className={styles.statLabel}>Free Entry</span>
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <FilterChips />

        {/* Sort Bar */}
        {!loading && !errorMsg && venueList.length > 0 && (
          <div className={styles.sortBar}>
            <label className={styles.sortLabel}>
              Sort by:
              <select
                className={styles.sortSelect}
                value={sortOption.value}
                onChange={handleSortChange}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <SkeletonLoader variant="card" height="280px" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{errorMsg}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMsg && venueList.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>
              No activities match your filters. Try adjusting your search criteria.
            </p>
            <div className={styles.emptyActions}>
              <Button onClick={clearAllFilters}>
                Clear All Filters
              </Button>
              <Button onClick={openCustomizeModal} variant="secondary">
                Adjust Filters
              </Button>
            </div>
          </div>
        )}

        {/* Activity Grid (regular venues, paginated) */}
        {!loading && !errorMsg && visibleRegular.length > 0 && (
          <>
            <div className={styles.grid}>
              {visibleRegular.map((venue, index) => (
                <ActivityCard
                  key={`${venue.name}-${index}`}
                  venue={venue}
                  variant={getCardVariant(venue)}
                  onClick={() => openActivityModal(venue)}
                />
              ))}
            </div>

            {hasMore && (
              <div className={styles.loadMoreWrapper}>
                <button type="button" className={styles.loadMore} onClick={handleLoadMore}>
                  Load More ({regularVenues.length - displayedCount.value} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modals */}
      <ActivityModal
        venue={selectedVenue.value}
        isOpen={isActivityModalOpen.value}
        onClose={closeActivityModal}
        imageUrl={modalImageUrl}
      />
      <CustomizeModal />
      <PrerequisitesModal />
      <ShareModal />
      <BookingModal />
    </div>
  );
}
