import type { Venue } from '@/types';
import styles from './ReviewsTab.module.css';

interface ReviewsTabProps {
  venue: Venue;
}

export function ReviewsTab({ venue }: ReviewsTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.rating}>
          <span className={styles.ratingValue}>{venue.rating.toFixed(1)}</span>
          <span className={styles.ratingStars}>{'*'.repeat(Math.round(venue.rating))}</span>
        </div>
        <p className={styles.ratingLabel}>Average rating</p>
      </div>

      <div className={styles.placeholder}>
        <p className={styles.placeholderText}>No reviews yet. Be the first to share your experience!</p>
      </div>
    </div>
  );
}
