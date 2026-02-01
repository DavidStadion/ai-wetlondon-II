import type { Venue } from '@/types';
import { WetnessIndicator } from '@/components/common/WetnessIndicator';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import styles from './OverviewTab.module.css';

interface OverviewTabProps {
  venue: Venue;
  imageUrl?: string;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function formatOpeningHours(hours: Record<string, string> | null | undefined): string {
  if (!hours) return 'Hours not available';

  const lines = DAY_ORDER
    .filter((day) => hours[day])
    .map((day) => `${DAY_LABELS[day]}: ${hours[day]}`);

  return lines.length > 0 ? lines.join('\n') : 'Hours not available';
}

function getAccessibilityInfo(prerequisites?: string[]): string {
  if (!prerequisites?.length) return 'Contact venue for details';

  const accessibilityTags = [
    'Wheelchair accessible',
    'Step-free',
    'Lift access',
    'Seating available',
  ];
  const found = prerequisites.filter((p) => accessibilityTags.includes(p));
  return found.length > 0 ? found.join(', ') : 'Contact venue for details';
}

function getGoogleMapsUrl(venueName: string, location: string): string {
  const query = encodeURIComponent(`${venueName}, ${location} London`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function OverviewTab({ venue, imageUrl }: OverviewTabProps) {
  const heroStyle = imageUrl
    ? { backgroundImage: `url(${imageUrl})` }
    : undefined;

  const handleBookClick = () => {
    if (venue.affiliateLink) {
      window.open(venue.affiliateLink, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${venue.name} London tickets`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div className={styles.hero} style={heroStyle} role="img" aria-label={venue.name} />

      <div className={styles.wetnessRow}>
        <WetnessIndicator score={venue.wetnessScore} level={venue.wetness} size="md" />
        <span>{venue.wetnessScore}% wet</span>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.description}>{venue.description}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">&#x1F687;</div>
            <div className={styles.infoContent}>
              <h4>Location</h4>
              <p>{venue.location.charAt(0).toUpperCase() + venue.location.slice(1)} London</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">&#x1F3AB;</div>
            <div className={styles.infoContent}>
              <h4>Price</h4>
              <p>{venue.priceDisplay}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">&#x267F;</div>
            <div className={styles.infoContent}>
              <h4>Accessibility</h4>
              <p>{getAccessibilityInfo(venue.prerequisites)}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">&#x1F552;</div>
            <div className={styles.infoContent}>
              <h4>Opening Hours</h4>
              <p>{formatOpeningHours(venue.openingHours)}</p>
            </div>
          </div>
        </div>
      </section>

      {venue.prerequisites && venue.prerequisites.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Amenities</h3>
          <div className={styles.tags}>
            {venue.prerequisites.map((tag) => (
              <Tag key={tag} label={tag} variant="display" />
            ))}
          </div>
        </section>
      )}

      <div className={styles.ctaSection}>
        <Button onClick={handleBookClick} size="lg" className={styles.ctaButton}>
          {venue.affiliateLink ? 'Book Tickets' : 'Find Tickets'}
        </Button>

        <a
          href={getGoogleMapsUrl(venue.name, venue.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapLink}
        >
          <span aria-hidden="true">&#x1F4CD;</span>
          View on Google Maps
        </a>
      </div>
    </div>
  );
}
