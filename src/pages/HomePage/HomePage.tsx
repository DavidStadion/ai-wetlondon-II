import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  venues,
  sortedVenues,
  isLoading,
  error,
  totalActivities,
  openNowCount,
  freeEntryCount,
} from '@/signals/venueSignals';
import { hasActiveFilters, clearAllFilters } from '@/signals/filterSignals';
import {
  loadBookmarks,
  loadRecentlyViewed,
  selectedVenue,
  isActivityModalOpen,
  isCustomizeModalOpen,
} from '@/signals/uiSignals';
import { partners } from '@/signals/partnerSignals';
import { fetchVenues, fetchPartners } from '@/utils/supabase';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, CardVariant, RouteProps } from '@/types';

import { Hero } from '@/components/Hero';
import { QuickFilters } from '@/components/QuickFilters';
import { PopularCategories } from '@/components/PopularCategories';
import { FilterChips } from '@/components/FilterChips';
import { ActivityCard } from '@/components/ActivityCard';
import { BookmarksSection } from '@/components/BookmarksSection';
import { TopPicksSection } from '@/components/TopPicksSection';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { WeatherRecommendations } from '@/components/WeatherRecommendations';
import { PopupsSection } from '@/components/PopupsSection';
import { PersonalizedSection } from '@/components/PersonalizedSection';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Button } from '@/components/common/Button';
import { AdSlot } from '@/components/common/AdSlot';
import { Carousel } from '@/components/common/Carousel';
import { PromoBand } from '@/components/common/PromoBand';
import { FilterBar } from '@/components/FilterBar';

import { ActivityModal } from '@/components/modals/ActivityModal';
import { CustomizeModal } from '@/components/modals/CustomizeModal';
import { PrerequisitesModal } from '@/components/modals/PrerequisitesModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { BookingModal } from '@/components/modals/BookingModal';

import styles from './HomePage.module.css';

const PAGE_SIZE = 18;
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
    fetchPartners().then((data) => { partners.value = data; }).catch(() => {});
  }, []);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(
    selected?.name ?? '',
    selected?.type ?? []
  );

  const loading = isLoading.value;
  const errorMsg = error.value;
  const venueList = sortedVenues.value;
  const filtersActive = hasActiveFilters.value;

  // Reset pagination when filters change
  useEffect(() => {
    displayedCount.value = PAGE_SIZE;
  }, [venueList]);

  // Deep links like /#activities land before the venues render, so the browser's
  // own jump finds nothing. Scroll once the content is actually on the page.
  useEffect(() => {
    if (loading) return;
    const { hash } = window.location;
    if (!hash || hash.length < 2) return;

    const target = document.getElementById(hash.slice(1));
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading]);

  // Split spotlight + featured venues (matching old version logic)
  const spotlightVenue = venueList.find((v) => v.spotlight) ?? null;
  const featuredVenues = venueList
    .filter((v) => v.featured && v.name !== spotlightVenue?.name);
  const regularVenues = venueList;

  // Editorial mosaic: one lead tile + two stacked; the rest fill the rail
  const mosaicPool = [spotlightVenue, ...featuredVenues].filter(Boolean) as Venue[];
  const mosaicLead = mosaicPool[0] ?? null;
  const mosaicSide = mosaicPool.slice(1, 3);

  // Rail: remaining featured, topped up with the best-rated dry venues so it never looks sparse
  const shown = new Set([...mosaicPool.slice(0, 3)].map((v) => v.name));
  const railExtras = [...venueList]
    .filter((v) => !shown.has(v.name))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.wetnessScore - b.wetnessScore);
  const featuredRail = [...mosaicPool.slice(3), ...railExtras]
    .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i)
    .slice(0, 10);

  // Paginate regular venues
  const visibleRegular = regularVenues.slice(0, displayedCount.value);
  const hasMore = regularVenues.length > displayedCount.value;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <Hero onCustomize={openCustomizeModal} onFeelingLucky={handleFeelingLucky} />

      {/* Quick Filter Pills */}
      <QuickFilters />

      {/* Personalized Selection Header */}
      {/* Filters are always visible rather than hidden behind a modal */}
      <FilterBar />

      {filtersActive && <PersonalizedSection />}

      {/* Featured — editorial mosaic (lead tile + two stacked) */}
      {!loading && !errorMsg && mosaicLead && (
        <section className={styles.mosaicSection} id="activities">
          <div className={styles.mosaic}>
            <div className={styles.mosaicLead}>
              <ActivityCard
                venue={mosaicLead}
                variant={mosaicLead.spotlight ? 'spotlight' : 'featured'}
                layout="overlay"
                size="lg"
                onClick={() => openActivityModal(mosaicLead)}
              />
            </div>
            <div className={styles.mosaicStack}>
              {mosaicSide.map((venue, index) => (
                <ActivityCard
                  key={`mosaic-${venue.name}-${index}`}
                  venue={venue}
                  variant="featured"
                  layout="overlay"
                  onClick={() => openActivityModal(venue)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured rail */}
      {!loading && !errorMsg && featuredRail.length > 0 && (
        <section className={styles.railSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Featured Activities</h2>
            <a className={styles.sectionLink} href="/#all-activities">See all</a>
          </div>
          <Carousel perView={4} ariaLabel="Featured activities">
            {featuredRail.map((venue, index) => (
              <ActivityCard
                key={`rail-${venue.name}-${index}`}
                venue={venue}
                tall
                onClick={() => openActivityModal(venue)}
              />
            ))}
          </Carousel>
        </section>
      )}

      {/* Promo — the club / rainy day alerts */}
      <PromoBand
        title="Never get caught out"
        titleAccent="again."
        body="We'll tell you when it's about to chuck it down — and exactly where to hide. One email, every Friday."
        ctaLabel="Join the club"
        ctaHref="/#join"
        tone="bold"
      />

      {/* Popular Categories */}
      <PopularCategories />

      {/* Banner Ad */}
      {!loading && !errorMsg && (
        <div className={styles.adWrapper}>
          <AdSlot slotId="PLACEHOLDER" format="horizontal" />
        </div>
      )}

      {/* Weather Recommendations */}
      {!loading && !errorMsg && (
        <WeatherRecommendations />
      )}

      {/* Pop-ups Section */}
      {!loading && !errorMsg && partners.value.length > 0 && (
        <PopupsSection />
      )}

      {/* Main Content - All Activities */}
      <section className={styles.content} id="all-activities">
        {/* All Activities Header */}
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>All Activities</h2>
          {!loading && (
            <p className={styles.subtitle}>
              {totalActivities.value} places across London
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

        {/* Dave and Kate's Top 3 */}
        <TopPicksSection />

        {/* Bookmarks Section */}
        <BookmarksSection />

        {/* Recently Viewed Section */}
        <RecentlyViewedSection />
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
