import { useState } from 'preact/hooks';
import { venues } from '@/signals/venueSignals';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue, VenueType } from '@/types';
import styles from './PopularCategories.module.css';

interface Category {
  id: VenueType;
  name: string;
  hidden?: boolean;
}

const CATEGORIES: Category[] = [
  { id: 'museums', name: 'Museums' },
  { id: 'galleries', name: 'Galleries' },
  { id: 'theatre', name: 'Theatre' },
  { id: 'dining', name: 'Dining' },
  { id: 'entertainment', name: 'Entertainment', hidden: true },
  { id: 'shopping', name: 'Shopping', hidden: true },
  { id: 'music', name: 'Music' },
  { id: 'comedy', name: 'Comedy', hidden: true },
  { id: 'gaming', name: 'Gaming', hidden: true },
  { id: 'wellness', name: 'Wellness & Spa', hidden: true },
  { id: 'cinema', name: 'Cinemas' },
  { id: 'historic', name: 'Historic', hidden: true },
];

function matchesCategory(v: Venue, categoryId: string): boolean {
  return v.type.some((t) => t.toLowerCase().includes(categoryId));
}

interface TileProps {
  category: Category;
  count: number;
  sample: Venue | undefined;
}

function CategoryTile({ category, count, sample }: TileProps) {
  const { src } = useImageLoader(sample?.name ?? category.name, sample?.type ?? []);

  return (
    <a className={styles.tile} href={`/category/${category.id}`}>
      <span
        className={styles.tileImage}
        style={{ backgroundImage: `url(${src})` }}
        aria-hidden="true"
      />
      <span className={styles.tileBody}>
        <span className={styles.tileName}>{category.name}</span>
        <span className={styles.tileCount}>{count} places</span>
      </span>
    </a>
  );
}

export function PopularCategories() {
  const [expanded, setExpanded] = useState(false);
  const allVenues = venues.value;

  const visible = CATEGORIES.filter((c) => expanded || !c.hidden);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <h2 className={styles.title}>Browse by category</h2>
          <button
            type="button"
            className={styles.showMoreBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show fewer' : 'Show all'}
          </button>
        </div>

        <div className={styles.grid}>
          {visible.map((category) => {
            const matches = allVenues.filter((v) => matchesCategory(v, category.id));
            return (
              <CategoryTile
                key={category.id}
                category={category}
                count={matches.length}
                sample={matches[0]}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
