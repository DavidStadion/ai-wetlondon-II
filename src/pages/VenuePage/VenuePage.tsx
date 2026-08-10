import { useEffect } from 'preact/hooks';
import { venues, isLoading } from '@/signals/venueSignals';
import { bookmarkedVenues, toggleBookmark, addToRecentlyViewed } from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { findVenueBySlug } from '@/utils/slug';
import { trackBookingClick } from '@/utils/consent';
import { setPageMeta, resetPageMeta } from '@/utils/meta';
import { isVenueOpenNow } from '@/utils/openingHours';
import { useImageLoader } from '@/hooks/useImageLoader';
import { OverviewTab } from '@/components/modals/ActivityModal/OverviewTab';
import { GalleryTab } from '@/components/modals/ActivityModal/GalleryTab';
import { ReviewsTab } from '@/components/modals/ActivityModal/ReviewsTab';
import { RelatedVenues } from '@/components/modals/ActivityModal/RelatedVenues';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { RouteProps, AreaType } from '@/types';

const AREA_LABELS: Record<AreaType, string> = {
  central: 'Central London',
  north: 'North London',
  south: 'South London',
  east: 'East London',
  west: 'West London',
};
import styles from './VenuePage.module.css';

interface VenueRouteProps extends RouteProps {
  slug?: string;
}

export function VenuePage({ slug }: VenueRouteProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      try {
        venues.value = await fetchVenues();
      } catch {
        // not-found state covers it
      } finally {
        isLoading.value = false;
      }
    }
    load();
  }, [slug]);

  const venue = slug ? findVenueBySlug(venues.value, slug) : undefined;
  const { src: imageUrl } = useImageLoader(venue?.name ?? '', venue?.type ?? []);

  useEffect(() => {
    if (venue) {
      addToRecentlyViewed(venue.name);
      // Must match the title scripts/prerender.mjs writes for this URL, so the
      // static HTML and the rendered page do not disagree about the page name.
      const area = AREA_LABELS[venue.location] ?? 'London';
      setPageMeta({
        title: `${venue.name} | ${area} indoor activity | Wet London`,
        description: `${venue.name} in ${area}: ${venue.description}`.replace(/\s+/g, ' ').slice(0, 300),
        path: `/venue/${slug}`,
      });
    }
    return resetPageMeta;
  }, [venue?.name]);

  if (isLoading.value) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}><LoadingSpinner text="Loading..." /></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h1 className={styles.nfTitle}>We can't find that place</h1>
          <p className={styles.nfText}>It may have been removed, or the link could be out of date.</p>
          <Button as="a" href="/all-activities" variant="accent">Browse all activities</Button>
        </div>
      </div>
    );
  }

  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));
  const isBookmarked = bookmarkedVenues.value.has(venue.name);
  const hasValidRating =
    typeof venue.rating === 'number' && venue.rating > 0 && venue.rating <= 5;
  const isFree = venue.price === 0;
  const openStatus = isVenueOpenNow(venue.openingHours);

  const bookingUrl =
    venue.affiliateLink ||
    `https://www.google.com/search?q=${encodeURIComponent(`${venue.name} London tickets`)}`;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: venue.name, text: `${venue.name} on Wet London`, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const area = venue.location.charAt(0).toUpperCase() + venue.location.slice(1);

  return (
    <article className={styles.page}>
      {/* Tinted masthead: title first, then a contained image */}
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <div className={styles.crumbRow}>
            <a className={styles.crumb} href="/all-activities">All activities</a>
            <a className={styles.crumbAlt} href={`/category/${venue.type[0] ?? ''}`}>
              More {venue.type[0] ?? 'places'}
            </a>
          </div>

          <div className={styles.kicker}>
            <span>{area}</span>
            {venue.type[0] && (
              <>
                <span className={styles.dot} aria-hidden="true" />
                <span>{venue.type[0]}</span>
              </>
            )}
          </div>

          <h1 className={styles.title}>{venue.name}</h1>

          <div className={styles.metaRow}>
            <span className={styles.price}>{venue.priceDisplay}</span>
            {hasValidRating && (
              <>
                <span className={styles.dot} aria-hidden="true" />
                <span>{'★'} {venue.rating.toFixed(1)}</span>
              </>
            )}
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.wetInline}>
              <span className={styles.wetMeter}><i style={{ width: `${Math.max(5, wet)}%` }} /></span>
              {wet}% wet
            </span>
            {openStatus !== null && (
              <>
                <span className={styles.dot} aria-hidden="true" />
                <span className={openStatus ? styles.open : styles.closed}>
                  {openStatus ? 'Open now' : 'Closed now'}
                </span>
              </>
            )}
          </div>

          <figure className={styles.figure}>
            <div
              className={styles.image}
              style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
              role="img"
              aria-label={venue.name}
            />
          </figure>

          <div className={styles.actions}>
            <a
              className={styles.bookBtn}
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
            onClick={() =>
              trackBookingClick({
                venue: venue.name,
                isAffiliate: Boolean(venue.affiliateLink),
                price: venue.price,
              })
            }
            >
              {isFree ? 'Plan your visit' : 'Book tickets'}
              <span aria-hidden="true">{'→'}</span>
            </a>
            <button
              type="button"
              className={`${styles.iconBtn} ${isBookmarked ? styles.iconBtnOn : ''}`}
              onClick={() => toggleBookmark(venue.name)}
              aria-pressed={isBookmarked}
            >
              {isBookmarked ? 'Saved' : 'Save it'}
            </button>
            <button type="button" className={styles.iconBtn} onClick={handleShare}>Share</button>
          </div>
        </div>
      </header>

      {/* Standfirst, the description, set as editorial copy */}
      <div className={styles.standfirstWrap}>
        <p className={styles.standfirst}>{venue.description}</p>
      </div>

      {/* The practical detail, in its own tinted panel */}
      <section className={styles.infoWrap} aria-label="Visiting information">
        <div className={styles.infoPanel}>
          <h2 className={styles.panelHeading}>Know before you go</h2>
          <OverviewTab venue={venue} hideAbout />
        </div>
      </section>

      <section className={styles.section} aria-label="Gallery">
        <h2 className={styles.sectionHeading}>Gallery</h2>
        <GalleryTab venueName={venue.name} imageUrl={imageUrl} />
      </section>

      <section className={styles.section} aria-label="Reviews">
        <h2 className={styles.sectionHeading}>Reviews</h2>
        <ReviewsTab venue={venue} />
      </section>

      <RelatedVenues venue={venue} />

      <BackToTop />
    </article>
  );
}
