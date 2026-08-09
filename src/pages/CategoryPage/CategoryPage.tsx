import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { venues, isLoading, sortOption } from '@/signals/venueSignals';
import type { SortOption } from '@/signals/venueSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { setPageMeta, resetPageMeta } from '@/utils/meta';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, VenueType, RouteProps } from '@/types';
import styles from './CategoryPage.module.css';

const PAGE_SIZE = 24;
const shown = signal(PAGE_SIZE);

/** Slug → the type key stored on venues, plus the copy for the page header. */
export const CATEGORIES: Record<string, { type: VenueType; label: string; blurb: string }> = {
  museums: { type: 'museums', label: 'Museums', blurb: 'Collections, curiosities and enough roof to see out any downpour.' },
  galleries: { type: 'galleries', label: 'Galleries', blurb: 'Art worth standing still for, all of it comfortably indoors.' },
  theatre: { type: 'theatre', label: 'Theatre', blurb: 'West End spectacle and tiny rooms above pubs. Both count.' },
  dining: { type: 'dining', label: 'Dining', blurb: 'Long lunches and somewhere warm to sit while it hammers down.' },
  entertainment: { type: 'entertainment', label: 'Entertainment', blurb: 'Immersive, interactive and reliably dry.' },
  shopping: { type: 'shopping', label: 'Shopping', blurb: 'Department stores, arcades and markets with a roof.' },
  wellness: { type: 'wellness', label: 'Wellness & Spa', blurb: 'Steam, sauna and doing very little on purpose.' },
  nightlife: { type: 'nightlife', label: 'Nightlife', blurb: 'Late ones that never need an umbrella.' },
  music: { type: 'music', label: 'Music Venues', blurb: 'From jazz basements to arena-sized nights.' },
  comedy: { type: 'comedy', label: 'Comedy Clubs', blurb: 'Cheap laughs and a low ceiling. Ideal.' },
  cinema: { type: 'cinema', label: 'Cinemas', blurb: 'Two hours somewhere warm in a very big chair.' },
  gaming: { type: 'gaming', label: 'Gaming', blurb: 'Arcades, VR, bowling and board games.' },
  workshops: { type: 'workshops', label: 'Classes & Workshops', blurb: 'Make something with your hands while it pours outside.' },
  historic: { type: 'historic', label: 'Historic Sites', blurb: 'Centuries of London, mercifully under cover.' },
  markets: { type: 'markets', label: 'Markets', blurb: 'Covered markets — browsing without the drenching.' },
  sports: { type: 'sports', label: 'Sports & Fitness', blurb: 'Climb, swim, skate and sweat indoors.' },
  exhibitions: { type: 'exhibitions', label: 'Exhibitions', blurb: 'Shows worth catching before they close.' },
  libraries: { type: 'libraries', label: 'Libraries', blurb: 'Quiet, free, and among the driest places in London.' },
};

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'wetness-asc', label: 'Driest first' },
  { value: 'price-asc', label: 'Cheapest first' },
  { value: 'name-asc', label: 'Name (A–Z)' },
];

function sortVenues(list: Venue[], sort: SortOption): Venue[] {
  const rating = (v: Venue) =>
    typeof v.rating === 'number' && v.rating > 0 && v.rating <= 5 ? v.rating : 0;

  return [...list].sort((a, b) => {
    switch (sort) {
      case 'rating-desc': return rating(b) - rating(a);
      case 'wetness-asc': return a.wetnessScore - b.wetnessScore;
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-desc': return b.name.localeCompare(a.name);
      default: return a.name.localeCompare(b.name);
    }
  });
}

interface CategoryRouteProps extends RouteProps {
  type?: string;
}

export function CategoryPage({ type }: CategoryRouteProps) {
  const slug = (type ?? '').toLowerCase();
  const category = CATEGORIES[slug];

  useEffect(() => {
    shown.value = PAGE_SIZE;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const c = CATEGORIES[slug];
    if (c) {
      setPageMeta({
        title: `${c.label} in London when it rains — Wet London`,
        description: `${c.blurb} Every ${c.label.toLowerCase()} listing on Wet London, rated by how dry you will stay.`,
        path: `/category/${slug}`,
      });
    }
    return resetPageMeta;

    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      try {
        venues.value = await fetchVenues();
      } catch {
        // empty state covers it
      } finally {
        isLoading.value = false;
      }
    }
    load();
  }, [slug]);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(selected?.name ?? '', selected?.type ?? []);

  if (!category) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Category not found</h1>
          <p className={styles.tagline}>We don't have a category by that name.</p>
          <div className={styles.heroActions}>
            <Button as="a" href="/all-activities" variant="accent">Browse all activities</Button>
          </div>
        </div>
      </div>
    );
  }

  const matches = venues.value.filter((v) =>
    v.type.some((t) => t.toLowerCase() === category.type)
  );
  const sorted = sortVenues(matches, sortOption.value);
  const visible = sorted.slice(0, shown.value);
  const hasMore = sorted.length > shown.value;
  const loading = isLoading.value;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <a className={styles.crumb} href="/all-activities">All activities</a>
        <h1 className={styles.title}>{category.label}</h1>
        <p className={styles.tagline}>{category.blurb}</p>
      </header>

      <section className={styles.container}>
        {loading && <LoadingSpinner text={`Loading ${category.label.toLowerCase()}...`} />}

        {!loading && (
          <div className={styles.toolbar}>
            <span className={styles.count}>
              {sorted.length} {sorted.length === 1 ? 'place' : 'places'}
            </span>
            <div className={styles.sortWrap}>
              <label className={styles.sortLabel} htmlFor="catSort">Sort by</label>
              <select
                id="catSort"
                className={styles.sortSelect}
                value={sortOption.value}
                onChange={(e) => { sortOption.value = (e.target as HTMLSelectElement).value as SortOption; }}
              >
                {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Nothing here yet</h2>
            <p className={styles.emptyText}>We haven't listed anything in {category.label} so far.</p>
            <Button as="a" href="/all-activities" variant="accent">Browse everything</Button>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <>
            <div className={styles.grid}>
              {visible.map((venue) => (
                <ActivityCard
                  key={venue.name}
                  venue={venue}
                  onClick={() => {
                    selectedVenue.value = venue;
                    isActivityModalOpen.value = true;
                  }}
                />
              ))}
            </div>

            {hasMore && (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  className={styles.loadMore}
                  onClick={() => { shown.value += PAGE_SIZE; }}
                >
                  Load more ({sorted.length - shown.value} remaining)
                </button>
              </div>
            )}
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
