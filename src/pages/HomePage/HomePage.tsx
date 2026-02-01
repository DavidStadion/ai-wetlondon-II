import { useEffect } from 'preact/hooks';
import {
  venues,
  filteredVenues,
  isLoading,
  error,
} from '@/signals/venueSignals';
import {
  loadBookmarks,
  loadRecentlyViewed,
  selectedVenue,
  isActivityModalOpen,
  isCustomizeModalOpen,
} from '@/signals/uiSignals';
import { venueCount } from '@/signals/venueSignals';
import { fetchVenues } from '@/utils/supabase';
import type { Venue, CardVariant, RouteProps } from '@/types';

import { SearchBar } from '@/components/SearchBar';
import { FilterChips } from '@/components/FilterChips';
import { ActivityCard } from '@/components/ActivityCard';
import { BookmarksSection } from '@/components/BookmarksSection';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { WeatherWidget } from '@/components/WeatherWidget';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Button } from '@/components/common/Button';

import { ActivityModal } from '@/components/modals/ActivityModal';
import { CustomizeModal } from '@/components/modals/CustomizeModal';
import { PrerequisitesModal } from '@/components/modals/PrerequisitesModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { BookingModal } from '@/components/modals/BookingModal';

import styles from './HomePage.module.css';

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
  const totalCount = venueCount.value;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <h1 className={styles.logo}>Wet London</h1>
            <p className={styles.tagline}>Indoor activities for rainy days</p>
          </div>
          <WeatherWidget />
        </div>
        <div className={styles.headerActions}>
          <SearchBar />
          <Button onClick={openCustomizeModal} variant="secondary">
            Customize
          </Button>
        </div>
      </header>

      {/* Filter Chips */}
      <FilterChips />

      {/* Main Content */}
      <section className={styles.content}>
        {/* Bookmarks Section */}
        <BookmarksSection />

        {/* Recently Viewed Section */}
        <RecentlyViewedSection />

        {/* Results Header */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {loading ? 'Loading activities...' : `${totalCount} activities`}
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
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

        {/* Activity Grid */}
        {!loading && !errorMsg && venueList.length > 0 && (
          <div className={styles.grid}>
            {venueList.map((venue) => (
              <ActivityCard
                key={venue.name}
                venue={venue}
                variant={getCardVariant(venue)}
                onClick={() => openActivityModal(venue)}
              />
            ))}
          </div>
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
