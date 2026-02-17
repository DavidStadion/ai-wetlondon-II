import { useState } from 'preact/hooks';
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
  hidden?: boolean;
}

const CATEGORIES: Category[] = [
  {
    id: 'museums',
    name: 'Museums',
    description: 'World-class collections and exhibitions from ancient artifacts to modern history',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    id: 'galleries',
    name: 'Galleries',
    description: 'Contemporary art spaces showcasing innovative and thought-provoking works',
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
    description: 'West End shows, intimate productions, and world-renowned performances',
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
    description: 'Culinary experiences from Michelin-starred restaurants to hidden gems',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Immersive experiences, shows, and attractions for all ages',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    description: 'From luxury department stores to quirky boutiques and markets',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'music',
    name: 'Music Venues',
    description: 'Live music from intimate jazz clubs to iconic concert halls',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'comedy',
    name: 'Comedy Clubs',
    description: 'Stand-up, improv, and comedy shows to brighten rainy days',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'VR experiences, arcades, board game cafes, and esports',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <circle cx="17" cy="10" r="1" />
        <circle cx="15" cy="14" r="1" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'wellness',
    name: 'Wellness & Spa',
    description: 'Relaxation, rejuvenation, and self-care experiences',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2c.5 4-1.5 6.5-3.5 8.5S4 14.5 4 18c0 2.5 1.5 4 4 4 1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4-1.5 4-4 0-3.5-2.5-5.5-4.5-7.5S11.5 6 12 2z" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'cinema',
    name: 'Cinemas',
    description: 'From arthouse screens to IMAX spectacles',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
    hidden: true,
  },
  {
    id: 'historic',
    name: 'Historic Sites',
    description: 'Castles, palaces, and landmarks steeped in history',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M9 21V8l3-3 3 3v13M5 21V10l4-4M19 21V10l-4-4M9 12h6M9 16h6" />
      </svg>
    ),
    hidden: true,
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
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Popular Categories</h2>
        <div className={`${styles.grid} ${expanded ? styles.expanded : ''}`}>
          {CATEGORIES.map((category) => {
            const count = getCategoryCount(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={`${styles.card} ${category.hidden ? styles.cardHidden : ''}`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={styles.iconWrapper}>{category.icon}</div>
                <h3 className={styles.cardTitle}>
                  {category.name} <span className={styles.cardCount}>({count})</span>
                </h3>
                <p className={styles.cardDescription}>{category.description}</p>
              </button>
            );
          })}
        </div>
        <div className={styles.showMoreWrapper}>
          <button
            type="button"
            className={styles.showMoreBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less Categories' : 'Show More Categories'}
          </button>
        </div>
      </div>
    </section>
  );
}
