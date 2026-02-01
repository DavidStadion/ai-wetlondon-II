import type { ComponentChildren } from 'preact';
import { venues } from '@/signals/venueSignals';
import { setTypeFilter } from '@/signals/filterSignals';
import type { VenueType } from '@/types';
import styles from './PopularCategories.module.css';

interface Category {
  id: VenueType;
  name: string;
  description: string;
  icon: ComponentChildren;
}

const CATEGORIES: Category[] = [
  {
    id: 'museums',
    name: 'Museums',
    description: 'World-class collections and exhibitions',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    id: 'galleries',
    name: 'Galleries',
    description: 'Contemporary art spaces',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    id: 'theatre',
    name: 'Theatre',
    description: 'West End shows and performances',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <circle cx="10" cy="8" r="2" />
        <path d="M8 12h4" />
        <circle cx="14" cy="8" r="2" />
      </svg>
    ),
  },
  {
    id: 'dining',
    name: 'Dining',
    description: 'Culinary experiences',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
];

function getCategoryCount(categoryId: string): number {
  return venues.value.filter((v) =>
    v.type.some((t) => t.toLowerCase().includes(categoryId))
  ).length;
}

function handleCategoryClick(categoryId: VenueType) {
  setTypeFilter(categoryId);
}

export function PopularCategories() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Popular Categories</h2>
        <div className={styles.grid}>
          {CATEGORIES.map((category) => {
            const count = getCategoryCount(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={styles.card}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={styles.iconWrapper}>{category.icon}</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{category.name}</h3>
                    <span className={styles.cardCount}>({count})</span>
                  </div>
                  <p className={styles.cardDescription}>{category.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
