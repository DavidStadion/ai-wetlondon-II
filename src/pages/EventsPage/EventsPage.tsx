import { useEffect } from 'preact/hooks';
import {
  events,
  eventFilter,
  isEventsLoading,
  eventsError,
  endingSoonEvents,
  currentEvents,
  comingSoonEvents,
} from '@/signals/eventSignals';
import { fetchEvents, sampleEvents } from '@/utils/supabase';
import type { Event, EventCategory, RouteProps } from '@/types';
import { EVENT_CATEGORY_LABELS } from '@/types/event';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import styles from './EventsPage.module.css';

const FILTERS: Array<{ value: EventCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All Events' },
  { value: 'exhibition', label: 'Exhibitions' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'immersive', label: 'Immersive' },
  { value: 'music', label: 'Music' },
  { value: 'festival', label: 'Festivals' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface EventCardProps {
  event: Event;
  badgeType: 'ends-soon' | 'live' | 'new';
}

function EventCard({ event, badgeType }: EventCardProps) {
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
          <span>Until {formatDate(event.endDate)}</span>
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

interface EventSectionProps {
  title: string;
  badge: string;
  badgeType: 'ends-soon' | 'live' | 'new';
  eventList: Event[];
}

function EventSection({ title, badge, badgeType, eventList }: EventSectionProps) {
  if (eventList.length === 0) return null;

  return (
    <section className={styles.eventsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={`${styles.sectionBadge} ${styles[`sectionBadge--${badgeType}`]}`}>
          {badge}
        </span>
      </div>
      <div className={styles.eventsGrid}>
        {eventList.map((event) => (
          <EventCard key={event.id} event={event} badgeType={badgeType} />
        ))}
      </div>
    </section>
  );
}

export function EventsPage(_props: RouteProps) {
  useEffect(() => {
    async function loadEvents() {
      isEventsLoading.value = true;
      eventsError.value = null;

      try {
        const data = await fetchEvents();
        events.value = data.length > 0 ? data : sampleEvents;
      } catch {
        events.value = sampleEvents;
      } finally {
        isEventsLoading.value = false;
      }
    }

    loadEvents();
  }, []);

  const loading = isEventsLoading.value;
  const filter = eventFilter.value;
  const ending = endingSoonEvents.value;
  const current = currentEvents.value;
  const coming = comingSoonEvents.value;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>What's On Now</h1>
        <p className={styles.tagline}>
          Limited-time indoor events, exhibitions, and experiences happening in London. Perfect for rainy days!
        </p>

        <div className={styles.filterBar}>
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterChip} ${filter === value ? styles.active : ''}`}
              onClick={() => { eventFilter.value = value; }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Events Container */}
      <section className={styles.container}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading events...</p>
          </div>
        )}

        {!loading && (
          <>
            <EventSection
              title="Ending Soon"
              badge="Last Chance"
              badgeType="ends-soon"
              eventList={ending}
            />
            <EventSection
              title="On Now"
              badge="Live"
              badgeType="live"
              eventList={current}
            />
            <EventSection
              title="Coming Soon"
              badge="New"
              badgeType="new"
              eventList={coming}
            />
          </>
        )}

        {!loading && ending.length === 0 && current.length === 0 && coming.length === 0 && (
          <div className={styles.noEvents}>
            <p>No events in this category.</p>
          </div>
        )}

        {/* Submit Event CTA */}
        <div className={styles.submitCta}>
          <h3 className={styles.ctaTitle}>Know an event we should feature?</h3>
          <p className={styles.ctaText}>Help fellow Londoners discover amazing indoor experiences during rainy days.</p>
          <Button
            as="a"
            href="mailto:hello@wetlondon.co.uk?subject=Event Suggestion"
          >
            Suggest an Event
          </Button>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
