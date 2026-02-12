import { useState, useEffect } from 'preact/hooks';
import type { Venue } from '@/types';
import { Button } from '@/components/common/Button';
import styles from './ReviewsTab.module.css';

interface ReviewsTabProps {
  venue: Venue;
}

interface GoogleReview {
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

interface UserReview {
  id: number;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}

interface PlaceDetails {
  rating: number | null;
  userRatingCount: number;
  reviews: GoogleReview[];
}

const detailsCache = new Map<string, PlaceDetails>();
const userReviewsCache = new Map<string, UserReview[]>();

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const className = size === 'lg' ? styles.starsLg : styles.starsSm;
  return (
    <span className={className} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

export function ReviewsTab({ venue }: ReviewsTabProps) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [formHover, setFormHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGoogleReviews() {
      const cached = detailsCache.get(venue.name);
      if (cached) {
        setDetails(cached);
        setLoadingGoogle(false);
        return;
      }

      try {
        const q = encodeURIComponent(`${venue.name} London`);
        const resp = await fetch(`/api/place-details?q=${q}`);
        if (!resp.ok) throw new Error('fetch failed');
        const data = await resp.json();

        const result: PlaceDetails = {
          rating: data.rating ?? null,
          userRatingCount: data.userRatingCount ?? 0,
          reviews: data.reviews ?? [],
        };

        if (!cancelled) {
          detailsCache.set(venue.name, result);
          setDetails(result);
        }
      } catch {
        if (!cancelled) {
          setDetails({ rating: null, userRatingCount: 0, reviews: [] });
        }
      } finally {
        if (!cancelled) setLoadingGoogle(false);
      }
    }

    async function fetchUserReviews() {
      const cached = userReviewsCache.get(venue.name);
      if (cached) {
        setUserReviews(cached);
        setLoadingUser(false);
        return;
      }

      try {
        const resp = await fetch(`/api/reviews?venue=${encodeURIComponent(venue.name)}`);
        if (!resp.ok) throw new Error('fetch failed');
        const data = await resp.json();
        const reviews: UserReview[] = data.reviews ?? [];

        if (!cancelled) {
          userReviewsCache.set(venue.name, reviews);
          setUserReviews(reviews);
        }
      } catch {
        if (!cancelled) setUserReviews([]);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    fetchGoogleReviews();
    fetchUserReviews();

    return () => { cancelled = true; };
  }, [venue.name]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitMsg(null);

    if (!formName.trim() || !formRating || formText.trim().length < 10) {
      setSubmitMsg({ type: 'error', text: 'Please fill in all fields (review must be at least 10 characters).' });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: venue.name,
          name: formName.trim(),
          rating: formRating,
          text: formText.trim(),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to submit');
      }

      // Add to local state
      const newReview: UserReview = {
        id: Date.now(),
        authorName: formName.trim(),
        rating: formRating,
        text: formText.trim(),
        relativeTime: 'Just now',
      };
      const updated = [newReview, ...userReviews];
      setUserReviews(updated);
      userReviewsCache.set(venue.name, updated);

      // Reset form
      setFormName('');
      setFormRating(0);
      setFormText('');
      setSubmitMsg({ type: 'success', text: 'Review submitted! Thanks for sharing.' });
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = details?.rating ?? venue.rating;
  const displayCount = details?.userRatingCount ?? 0;

  return (
    <div className={styles.container}>
      {/* Rating summary */}
      <div className={styles.summary}>
        <div className={styles.ratingBlock}>
          <span className={styles.ratingValue}>{displayRating?.toFixed(1) ?? '—'}</span>
          <div className={styles.ratingMeta}>
            <Stars rating={displayRating ?? 0} size="lg" />
            {displayCount > 0 && (
              <span className={styles.ratingCount}>Based on {displayCount.toLocaleString()} Google reviews</span>
            )}
          </div>
        </div>
      </div>

      {/* Google Reviews */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Google Reviews</h3>
        {loadingGoogle ? (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
            <span>Loading reviews...</span>
          </div>
        ) : details && details.reviews.length > 0 ? (
          <div className={styles.reviewList}>
            {details.reviews.map((review, i) => (
              <div key={i} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  {review.authorPhoto ? (
                    <img src={review.authorPhoto} alt="" className={styles.authorPhoto} />
                  ) : (
                    <div className={styles.authorInitial}>
                      {review.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className={styles.authorName}>{review.authorName}</span>
                    <div className={styles.reviewMeta}>
                      <Stars rating={review.rating} />
                      <span className={styles.reviewTime}>{review.relativeTime}</span>
                    </div>
                  </div>
                </div>
                {review.text && <p className={styles.reviewText}>{review.text}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noReviews}>No Google reviews available.</p>
        )}
      </section>

      {/* Community Reviews */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Wet London Community</h3>
        {loadingUser ? (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
            <span>Loading community reviews...</span>
          </div>
        ) : userReviews.length > 0 ? (
          <div className={styles.reviewList}>
            {userReviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.authorInitial}>
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className={styles.authorName}>{review.authorName}</span>
                    <div className={styles.reviewMeta}>
                      <Stars rating={review.rating} />
                      <span className={styles.reviewTime}>{review.relativeTime}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.reviewText}>{review.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noReviews}>No community reviews yet. Be the first!</p>
        )}
      </section>

      {/* Review form */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Write a Review</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.input}
            placeholder="Your name"
            value={formName}
            onInput={(e) => setFormName((e.target as HTMLInputElement).value)}
            maxLength={50}
          />

          <div className={styles.starPicker}>
            <span className={styles.starPickerLabel}>Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.starBtn} ${star <= (formHover || formRating) ? styles['starBtn--active'] : ''}`}
                onClick={() => setFormRating(star)}
                onMouseEnter={() => setFormHover(star)}
                onMouseLeave={() => setFormHover(0)}
                aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>

          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Share your experience (min 10 characters)"
              value={formText}
              onInput={(e) => setFormText((e.target as HTMLTextAreaElement).value)}
              maxLength={1000}
              rows={4}
            />
            <span className={styles.charCount}>{formText.length}/1000</span>
          </div>

          {submitMsg && (
            <p className={submitMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
              {submitMsg.text}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </section>
    </div>
  );
}
