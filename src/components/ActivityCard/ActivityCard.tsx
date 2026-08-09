import type { Venue, CardVariant, VenueType, AreaType } from '@/types/venue';
import { bookmarkedVenues, toggleBookmark } from '@/signals/uiSignals';
import { useImageLoader } from '@/hooks/useImageLoader';
import { isVenueOpenNow } from '@/utils/openingHours';
import styles from './ActivityCard.module.css';

export interface ActivityCardProps {
  venue: Venue;
  variant?: CardVariant;
  onClick?: () => void;
  /** 'overlay' puts the headline on the image (editorial hero style). */
  layout?: 'stacked' | 'overlay';
  /** Overlay sizing: 'lg' for the lead mosaic tile. */
  size?: 'md' | 'lg';
  /** Show the one-line description under the headline. */
  showDescription?: boolean;
  /** Portrait image crop — used for taller, more editorial rails. */
  tall?: boolean;
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

export function ActivityCard({
  venue,
  variant = 'default',
  onClick,
  layout = 'stacked',
  size = 'md',
  showDescription = false,
  tall = false,
}: ActivityCardProps) {
  const isBookmarked = bookmarkedVenues.value.has(venue.name);
  const badgeText = VARIANT_BADGES[variant];
  const { src: imageSrc, isLoading: imageLoading } = useImageLoader(venue.name, venue.type);
  const openStatus = isVenueOpenNow(venue.openingHours);
  const isOverlay = layout === 'overlay';

  const cardClasses = [
    styles.card,
    isOverlay ? styles.overlay : styles.stacked,
    isOverlay && size === 'lg' && styles.overlayLg,
    tall && styles.tall,
    variant !== 'default' && styles[`card--${variant}`],
  ].filter(Boolean).join(' ');

  const handleBookmarkToggle = () => toggleBookmark(venue.name);

  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));

  // Some rows carry out-of-range ratings (e.g. 45) — don't render a nonsense star score.
  const hasValidRating =
    typeof venue.rating === 'number' && venue.rating > 0 && venue.rating <= 5;

  const kicker = (
    <div className={styles.kicker}>
      <span className={styles.area}>{AREA_LABELS[venue.location]}</span>
      {venue.type[0] && (
        <>
          <span className={styles.sep} aria-hidden="true" />
          <span>{formatType(venue.type[0])}</span>
        </>
      )}
    </div>
  );

  const media = (
    <div className={styles.image}>
      <div
        className={styles.imagePlaceholder}
        style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-hidden="true"
      />
      {imageLoading && <div className={styles.imageShimmer} />}

      <span className={styles.wetBadge} title={`Wetness score: ${wet} out of 100`}>
        <span className={styles.wetMeter}><i style={{ width: `${Math.max(5, wet)}%` }} /></span>
        {wet}% WET
      </span>

      {badgeText && (
        <span className={`${styles.badge} ${styles[`badge--${variant}`] ?? ''}`}>{badgeText}</span>
      )}

      {openStatus === true && <span className={styles.statusOpen}>OPEN NOW</span>}
      {openStatus === false && <span className={styles.statusClosed}>CLOSED</span>}

      <button
        type="button"
        className={`${styles.saveBtn} ${isBookmarked ? styles.saveBtnOn : ''}`}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? `Remove ${venue.name} from saved` : `Save ${venue.name}`}
        onClick={(e) => {
          e.stopPropagation();
          handleBookmarkToggle();
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            fill={isBookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linejoin="round"
          />
        </svg>
        <span className={styles.saveLabel}>{isBookmarked ? 'Saved' : 'Save it'}</span>
      </button>

      {isOverlay && (
        <div className={styles.overlayContent}>
          {kicker}
          <h3 className={styles.name}>{venue.name}</h3>
        </div>
      )}
    </div>
  );

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
      {media}

      {!isOverlay && (
        <div className={styles.content}>
          {kicker}
          <h3 className={styles.name}>{venue.name}</h3>
          {showDescription && <p className={styles.description}>{venue.description}</p>}
          <div className={styles.metaRow}>
            <span className={styles.price}>{venue.priceDisplay}</span>
            {hasValidRating && (
              <>
                <span className={styles.sep} aria-hidden="true" />
                <span className={styles.rating}>★ {venue.rating.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
