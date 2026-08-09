import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { venues, isLoading } from '@/signals/venueSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { setPageMeta, resetPageMeta } from '@/utils/meta';
import { COLLECTIONS, getCollection, venuesFor } from '@/utils/collections';
import { useImageLoader } from '@/hooks/useImageLoader';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Venue, RouteProps } from '@/types';
import styles from './CollectionsPage.module.css';

const PAGE_SIZE = 24;
const shown = signal(PAGE_SIZE);

/** Card for the index — leads with a photo from the collection itself. */
function CollectionCard({ slug, title, titleAccent, teaser, lead, count }: {
  slug: string; title: string; titleAccent?: string; teaser: string;
  lead: Venue | undefined; count: number;
}) {
  const { src } = useImageLoader(lead?.name ?? '', lead?.type ?? []);

  return (
    <a className={styles.card} href={`/collection/${slug}`}>
      <span className={styles.cardImage} style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      <span className={styles.cardBody}>
        <span className={styles.cardCount}>{count} places</span>
        <span className={styles.cardTitle}>
          {title} {titleAccent && <em>{titleAccent}</em>}
        </span>
        <span className={styles.cardTeaser}>{teaser}</span>
      </span>
    </a>
  );
}

function useVenueLoad(dep: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    shown.value = PAGE_SIZE;

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
  }, [dep]);
}

/* ── Index ─────────────────────────────────────────────────────────── */

export function CollectionsPage(_props: RouteProps) {
  useVenueLoad('index');

  useEffect(() => {
    setPageMeta({
      title: 'Collections — Wet London',
      description:
        'Curated ways into London indoors: brilliant when it’s chucking it down, under a tenner, somewhere genuinely weird, and more.',
      path: '/collections',
    });
    return resetPageMeta;
  }, []);

  const all = venues.value;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Collections</h1>
        <p className={styles.tagline}>
          Not categories — angles. The same London, sorted by the kind of day you're
          actually having.
        </p>
      </header>

      <section className={styles.container}>
        {isLoading.value && <LoadingSpinner text="Loading collections..." />}

        {!isLoading.value && (
          <div className={styles.grid}>
            {COLLECTIONS.map((c) => {
              const list = venuesFor(c, all);
              return (
                <CollectionCard
                  key={c.slug}
                  slug={c.slug}
                  title={c.title}
                  titleAccent={c.titleAccent}
                  teaser={c.teaser}
                  lead={list[0]}
                  count={list.length}
                />
              );
            })}
          </div>
        )}
      </section>

      <BackToTop />
    </div>
  );
}

/* ── Single collection ─────────────────────────────────────────────── */

interface CollectionRouteProps extends RouteProps {
  slug?: string;
}

export function CollectionPage({ slug }: CollectionRouteProps) {
  useVenueLoad(slug);

  const collection = slug ? getCollection(slug) : undefined;

  useEffect(() => {
    if (collection) {
      setPageMeta({
        title: `${collection.title} ${collection.titleAccent ?? ''} — Wet London`.replace(/\s+/g, ' '),
        description: collection.blurb,
        path: `/collection/${slug}`,
      });
    }
    return resetPageMeta;
  }, [slug]);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(selected?.name ?? '', selected?.type ?? []);

  if (!collection) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Collection not found</h1>
          <p className={styles.tagline}>We don't have a collection by that name.</p>
          <div className={styles.heroActions}>
            <Button as="a" href="/collections" variant="accent">See all collections</Button>
          </div>
        </div>
      </div>
    );
  }

  const list = venuesFor(collection, venues.value);
  const visible = list.slice(0, shown.value);
  const hasMore = list.length > shown.value;

  return (
    <div className={styles.page}>
      <header className={styles.collectionHero}>
        <div className={styles.collectionHeroInner}>
          <a className={styles.crumb} href="/collections">All collections</a>
          <h1 className={styles.collectionTitle}>
            {collection.title} {collection.titleAccent && <em>{collection.titleAccent}</em>}
          </h1>
          <p className={styles.blurb}>{collection.blurb}</p>
          <span className={styles.count}>{list.length} places</span>
        </div>
      </header>

      <section className={styles.container}>
        {isLoading.value && <LoadingSpinner text="Loading..." />}

        {!isLoading.value && visible.length > 0 && (
          <>
            <div className={styles.venueGrid}>
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
                  Load more ({list.length - shown.value} remaining)
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
