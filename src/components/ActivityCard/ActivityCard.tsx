import type { Venue, CardVariant, VenueType, AreaType } from '@/types/venue';
import { BookmarkIcon } from '@/components/common/BookmarkIcon';
import { bookmarkedVenues, toggleBookmark } from '@/signals/uiSignals';
import { useImageLoader } from '@/hooks/useImageLoader';
import { isVenueOpenNow } from '@/utils/openingHours';
import styles from './ActivityCard.module.css';

export interface ActivityCardProps {
  venue: Venue;
  variant?: CardVariant;
  onClick?: () => void;
}

const VARIANT_BADGES: Partial<Record<CardVariant, string>> = {
  featured: 'FEATURED',
  sponsored: 'SPONSORED',
  partner: 'PARTNER',
  spotlight: 'SPOTLIGHT',
  spotlightHero: 'SPOTLIGHT',
};

const AREA_LABELS: Record<AreaType, string> = {
  central: 'Central',
  west: 'West',
  east: 'East',
  north: 'North',
  south: 'South',
};

function formatType(type: VenueType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function ActivityCard({ venue, variant = 'default', onClick }: ActivityCardProps) {
  const isBookmarked = bookmarkedVenues.value.has(venue.name);
  const badgeText = VARIANT_BADGES[variant];
  const { src: imageSrc, isLoading: imageLoading } = useImageLoader(venue.name, venue.type);
  const openStatus = isVenueOpenNow(venue.openingHours);

  const cardClasses = [
    styles.card,
    variant !== 'default' && styles[`card--${variant}`],
  ].filter(Boolean).join(' ');

  const handleBookmarkToggle = () => {
    toggleBookmark(venue.name);
  };

  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));

  return (
    <article
      className={cardClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={styles.image}>
        <div
          className={styles.imagePlaceholder}
          style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
        {imageLoading && <div className={styles.imageShimmer} />}

        {/* Signature wetness badge */}
        <span className={styles.wetBadge} title={`Wetness score: ${wet} out of 100`}>
          <span className={styles.wetMeter}><i style={{ width: `${Math.max(5, wet)}%` }} /></span>
          {wet}% WET
        </span>

        {badgeText && (
          <span className={`${styles.badge} ${styles[`badge--${variant}`]}`}>
            {badgeText}
          </span>
        )}

        {openStatus === true && (
          <span className={styles.statusOpen}>OPEN NOW</span>
        )}
        {openStatus === false && (
          <span className={styles.statusClosed}>CLOSED</span>
        )}

        <span className={styles.bookmarkWrap} onClick={(e) => e.stopPropagation()}>
          <BookmarkIcon
            isBookmarked={isBookmarked}
            onToggle={handleBookmarkToggle}
            size={20}
            className={styles.bookmark}
          />
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.kicker}>
          <span className={styles.area}>{AREA_LABELS[venue.location]}</span>
          {venue.type[0] && (
            <>
              <span className={styles.sep} aria-hidden="true" />
              <span>{formatType(venue.type[0])}</span>
            </>
          )}
        </div>

        <h3 className={styles.name}>{venue.name}</h3>

        <p className={styles.description}>{venue.description}</p>

        <div className={styles.metaRow}>
          <span className={styles.price}>{venue.priceDisplay}</span>
          {typeof venue.rating === 'number' && venue.rating > 0 && (
            <>
              <span className={styles.sep} aria-hidden="true" />
              <span className={styles.rating}>★ {venue.rating.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
