import type { Venue, CardVariant, VenueType, AreaType } from '@/types/venue';
import { BookmarkIcon } from '@/components/common/BookmarkIcon';
import { WetnessIndicator } from '@/components/common/WetnessIndicator';
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

  return (
    <article className={cardClasses}>
      <div className={styles.image}>
        <div
          className={styles.imagePlaceholder}
          style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
        {imageLoading && <div className={styles.imageShimmer} />}

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

        <BookmarkIcon
          isBookmarked={isBookmarked}
          onToggle={handleBookmarkToggle}
          size={20}
          className={styles.bookmark}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{venue.name}</h3>

        <div className={styles.tags}>
          <span className={styles.tag}>{AREA_LABELS[venue.location]}</span>
          {venue.type.slice(0, 2).map((t) => (
            <span key={t} className={styles.tag}>{formatType(t)}</span>
          ))}
        </div>

        <p className={styles.description}>{venue.description}</p>

        <div className={styles.footer}>
          <WetnessIndicator
            score={venue.wetnessScore}
            level={venue.wetness}
            size="sm"
          />
          <span className={styles.price}>{venue.priceDisplay}</span>
        </div>

        <button type="button" className={styles.cta} onClick={onClick}>
          View Details
        </button>
      </div>
    </article>
  );
}
