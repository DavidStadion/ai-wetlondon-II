import { formatEventDate, getDaysLeft } from '@/utils/dateFormatters';
import { EVENT_CATEGORY_LABELS } from '@/types/event';
import type { Event } from '@/types';
import styles from './EventCard.module.css';

export interface EventCardProps {
  event: Event;
  badgeType: 'ends-soon' | 'live' | 'new';
}

export function EventCard({ event, badgeType }: EventCardProps) {
  const daysLeft = getDaysLeft(event.endDate);

  let badgeText = '';
  if (badgeType === 'ends-soon' && daysLeft <= 14) {
    badgeText = daysLeft <= 7 ? `${daysLeft} days left` : 'Ending soon';
  } else if (badgeType === 'new') {
    badgeText = 'Coming soon';
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' London')}`;

  return (
    <article className={styles.eventCard}>
      <div
        className={styles.eventImage}
        style={event.imageUrl ? { backgroundImage: `url('${event.imageUrl}')` } : undefined}
      >
        {badgeText && (
          <span className={`${styles.eventBadge} ${styles[`eventBadge--${badgeType}`]}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className={styles.eventContent}>
        <div className={styles.eventCategory}>
          {EVENT_CATEGORY_LABELS[event.category]}
        </div>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <div className={styles.eventVenue}>
          {event.venue}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapLink}
            title="View on Google Maps"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </a>
        </div>
        <div className={styles.eventMeta}>
          <span>Until {formatEventDate(event.endDate)}</span>
        </div>
      </div>

      <div className={styles.eventFooter}>
        <span className={`${styles.eventPrice} ${event.price === 0 ? styles.free : ''}`}>
          {event.priceDisplay}
        </span>
        <a href={event.link} target="_blank" rel="noopener noreferrer" className={styles.eventBtn}>
          Book Now
        </a>
      </div>
    </article>
  );
}
