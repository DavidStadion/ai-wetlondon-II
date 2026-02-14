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
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FilterChipBar } from '@/components/common/FilterChipBar';
import { EventCard } from '@/components/EventCard';
import styles from './EventsPage.module.css';

const FILTERS: Array<{ value: EventCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All Events' },
  { value: 'exhibition', label: 'Exhibitions' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'immersive', label: 'Immersive' },
  { value: 'music', label: 'Music' },
  { value: 'festival', label: 'Festivals' },
];

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

        <FilterChipBar
          options={FILTERS}
          selected={filter}
          onSelect={(value) => { eventFilter.value = value; }}
        />
      </section>

      {/* Events Container */}
      <section className={styles.container}>
        {loading && <LoadingSpinner text="Loading events..." />}

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
