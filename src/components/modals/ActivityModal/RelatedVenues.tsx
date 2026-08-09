import { venues } from '@/signals/venueSignals';
import { selectedVenue } from '@/signals/uiSignals';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, AreaType } from '@/types';
import styles from './RelatedVenues.module.css';

const AREA_LABELS: Record<AreaType, string> = {
  central: 'Central',
  west: 'West',
  east: 'East',
  north: 'North',
  south: 'South',
};

/** Score by shared type, then same area, then rating, closest matches first. */
function relatedTo(current: Venue, all: Venue[]): Venue[] {
  const types = new Set(current.type);

  return all
    .filter((v) => v.name !== current.name)
    .map((v) => {
      const shared = v.type.filter((t) => types.has(t)).length;
      const areaBonus = v.location === current.location ? 0.5 : 0;
      const rating = typeof v.rating === 'number' && v.rating <= 5 ? v.rating : 0;
      return { venue: v, score: shared * 3 + areaBonus + rating / 5 };
    })
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.venue);
}

function RelatedCard({ venue }: { venue: Venue }) {
  const { src } = useImageLoader(venue.name, venue.type);
  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => {
        selectedVenue.value = venue;
        document.querySelector('[role="dialog"]')?.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <span className={styles.image} style={{ backgroundImage: `url(${src})` }} aria-hidden="true">
        <span className={styles.wet}>{wet}% wet</span>
      </span>
      <span className={styles.kicker}>
        {AREA_LABELS[venue.location]}
        {venue.type[0] ? ` · ${venue.type[0]}` : ''}
      </span>
      <span className={styles.name}>{venue.name}</span>
      <span className={styles.price}>{venue.priceDisplay}</span>
    </button>
  );
}

export function RelatedVenues({ venue }: { venue: Venue }) {
  const related = relatedTo(venue, venues.value);
  if (related.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Related activities">
      <h3 className={styles.title}>
        Like that? You'll <em>love this</em>
      </h3>
      <div className={styles.rail}>
        {related.map((v) => (
          <RelatedCard key={v.name} venue={v} />
        ))}
      </div>
    </section>
  );
}
