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
import { hasActiveFilters } from '@/signals/filterSignals';
import {
  loadBookmarks,
  loadRecentlyViewed,
  selectedVenue,
  isActivityModalOpen,
  isCustomizeModalOpen,
} from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import type { Venue, CardVariant, RouteProps } from '@/types';

import { Hero } from '@/components/Hero';
import { PopularCategories } from '@/components/PopularCategories';
import { FilterChips } from '@/components/FilterChips';
import { ActivityCard } from '@/components/ActivityCard';
import { BookmarksSection } from '@/components/BookmarksSection';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
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
  if (venue.featured) return 'featured';
  if (venue.sponsored) return 'sponsored';
  if (venue.highlighted) return 'spotlight';
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

  const loading = isLoading.value;
  const errorMsg = error.value;
  const venueList = filteredVenues.value;
  const filtersActive = hasActiveFilters.value;

  // Reset pagination when filters change
  useEffect(() => {
    displayedCount.value = PAGE_SIZE;
  }, [venueList]);

  // Split featured vs regular venues
  const featuredVenues = venueList.filter((v) => v.featured || v.highlighted);
  const regularVenues = venueList.filter((v) => !v.featured && !v.highlighted);

  // First highlighted venue gets spotlight hero treatment
  const spotlightVenue = featuredVenues.find((v) => v.highlighted) ?? featuredVenues[0];
  const remainingFeatured = featuredVenues.filter((v) => v !== spotlightVenue);

  // Paginate regular venues
  const visibleRegular = regularVenues.slice(0, displayedCount.value);
  const hasMore = regularVenues.length > displayedCount.value;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <Hero onCustomize={openCustomizeModal} onFeelingLucky={handleFeelingLucky} />

      {/* Popular Categories */}
      <PopularCategories />

      {/* Featured Activities Section */}
      {!loading && !errorMsg && featuredVenues.length > 0 && !filtersActive && (
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

          {remainingFeatured.length > 0 && (
            <div className={styles.grid}>
              {remainingFeatured.map((venue, index) => (
                <ActivityCard
                  key={`featured-${venue.name}-${index}`}
                  venue={venue}
                  variant={getCardVariant(venue)}
                  onClick={() => openActivityModal(venue)}
                />
              ))}
            </div>
          )}
        </section>
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
            <Button onClick={openCustomizeModal} variant="secondary">
              Customize Filters
            </Button>
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
      />
      <CustomizeModal />
      <PrerequisitesModal />
      <ShareModal />
      <BookingModal />
    </div>
  );
}
