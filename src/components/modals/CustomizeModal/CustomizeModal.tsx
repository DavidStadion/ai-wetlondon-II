import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { isCustomizeModalOpen } from '@/signals/uiSignals';
import { venueCount } from '@/signals/venueSignals';
import {
  keywords,
  selectedTypes,
  selectedAreas,
  wetnessLevel,
  maxPrice,
  openNow,
  constraints,
  toggleType,
  toggleArea,
  toggleConstraint,
  clearAllFilters,
  hasActiveFilters,
} from '@/signals/filterSignals';
import type { VenueType, AreaType, WetnessLevel } from '@/types';
import styles from './CustomizeModal.module.css';

const TYPE_OPTIONS: Array<{ value: VenueType; label: string }> = [
  { value: 'museums', label: 'Museums' },
  { value: 'galleries', label: 'Galleries' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'music', label: 'Music Venues' },
  { value: 'comedy', label: 'Comedy Clubs' },
  { value: 'cinema', label: 'Cinemas' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'workshops', label: 'Classes & Workshops' },
  { value: 'historic', label: 'Historic Sites' },
  { value: 'markets', label: 'Markets' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'exhibitions', label: 'Exhibitions' },
  { value: 'libraries', label: 'Libraries' },
];

const AREA_OPTIONS: Array<{ value: AreaType | 'all'; label: string }> = [
  { value: 'all', label: 'All London' },
  { value: 'central', label: 'Central' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

const WETNESS_OPTIONS: Array<{ value: WetnessLevel | 'any'; label: string; description: string }> = [
  { value: 'any', label: "Don't mind", description: 'Show me everything' },
  { value: 'dry', label: 'Bone dry', description: 'Door-to-door under cover' },
  { value: 'slightly', label: 'A short dash', description: '5–10 minutes from a station' },
  { value: 'wet', label: 'Happy to get wet', description: 'Outdoor stretches are fine' },
];

const PRICE_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Any price' },
  { value: 0, label: 'Free' },
  { value: 10, label: 'Under £10' },
  { value: 20, label: 'Under £20' },
];

/** The things that decide whether somewhere actually works for someone. */
const NEEDS: Array<{ title: string; note?: string; items: string[] }> = [
  {
    title: 'Access & mobility',
    items: ['Wheelchair accessible', 'Step-free', 'Lift access', 'Seating available', 'Avoid stairs', 'Low-impact'],
  },
  {
    title: 'Sensory & comfort',
    note: 'Useful if crowds, noise or bright lights are a problem',
    items: ['Quiet environment', 'Avoid crowds', 'No flashing lights', 'No loud music', 'Well-lit spaces', 'Climate controlled'],
  },
  {
    title: 'Neurodiverse',
    items: ['Low sensory', 'Quiet hours', 'Predictable layouts'],
  },
  {
    title: 'With children',
    items: ['Child-friendly', 'Pushchair-friendly', 'Family tickets', 'Quiet spaces', 'Interactive exhibits'],
  },
  {
    title: 'Dietary',
    items: ['Vegan options', 'Vegetarian', 'Gluten-free', 'Halal', 'Kosher', 'Dairy-free', 'Nut-free'],
  },
];

export function CustomizeModal() {
  const isOpen = isCustomizeModalOpen.value;
  const handleClose = () => { isCustomizeModalOpen.value = false; };

  const isAllAreas = selectedAreas.value.size === 0;
  const currentWetness = wetnessLevel.value ?? 'any';
  const selectedNeeds = constraints.value;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Customise your experience" size="lg">
      <div className={styles.form}>
        <p className={styles.intro}>
          Tell us what matters and we'll only show places that fit.
        </p>

        {/* What matters most — accessibility and comfort lead, rather than hiding
            behind a button that opened a second modal on top of this one. */}
        <section className={`${styles.section} ${styles.needsSection}`}>
          <div className={styles.sectionHead}>
            <h3 className={styles.heading}>Anything we should know?</h3>
            {selectedNeeds.size > 0 && (
              <span className={styles.badge}>{selectedNeeds.size} selected</span>
            )}
          </div>
          <p className={styles.hint}>
            These make the difference between a place working and being a wasted trip.
          </p>

          <div className={styles.needsGrid}>
            {NEEDS.map((group) => (
              <div key={group.title} className={styles.needGroup}>
                <span className={styles.needTitle}>{group.title}</span>
                {group.note && <span className={styles.needNote}>{group.note}</span>}
                <div className={styles.chips}>
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.chip} ${selectedNeeds.has(item) ? styles.chipOn : ''}`}
                      aria-pressed={selectedNeeds.has(item)}
                      onClick={() => toggleConstraint(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>What are you after?</h3>
          <input
            type="text"
            className={styles.input}
            placeholder="Somewhere warm, a bit of history, decent coffee…"
            value={keywords.value}
            onInput={(e) => { keywords.value = (e.target as HTMLInputElement).value; }}
          />
          <div className={styles.chips}>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.chip} ${selectedTypes.value.has(t.value) ? styles.chipOn : ''}`}
                aria-pressed={selectedTypes.value.has(t.value)}
                onClick={() => toggleType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.twoUp}>
          <section className={styles.section}>
            <h3 className={styles.heading}>Where</h3>
            <div className={styles.chips}>
              {AREA_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={`${styles.chip} ${
                    a.value === 'all' ? (isAllAreas ? styles.chipOn : '') :
                    selectedAreas.value.has(a.value as AreaType) ? styles.chipOn : ''
                  }`}
                  onClick={() => {
                    if (a.value === 'all') selectedAreas.value = new Set();
                    else toggleArea(a.value as AreaType);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.heading}>Budget</h3>
            <div className={styles.chips}>
              {PRICE_OPTIONS.map((p) => (
                <button
                  key={String(p.value)}
                  type="button"
                  className={`${styles.chip} ${maxPrice.value === p.value ? styles.chipOn : ''}`}
                  onClick={() => { maxPrice.value = p.value; }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className={styles.section}>
          <h3 className={styles.heading}>How wet are you prepared to get?</h3>
          <div className={styles.wetnessGrid}>
            {WETNESS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`${styles.wetOption} ${currentWetness === o.value ? styles.wetOptionOn : ''}`}
                onClick={() => { wetnessLevel.value = o.value === 'any' ? null : o.value; }}
              >
                <strong>{o.label}</strong>
                <span>{o.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={openNow.value}
              onChange={() => { openNow.value = !openNow.value; }}
            />
            <span>
              <strong>Open right now</strong>
              <span className={styles.hint}>Hide anywhere that's currently closed</span>
            </span>
          </label>
        </section>
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={clearAllFilters} disabled={!hasActiveFilters.value}>
          Clear all
        </Button>
        <Button variant="accent" onClick={handleClose}>
          Show {venueCount.value} {venueCount.value === 1 ? 'place' : 'places'}
        </Button>
      </div>
    </Modal>
  );
}
