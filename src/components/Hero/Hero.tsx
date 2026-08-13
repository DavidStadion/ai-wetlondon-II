import { heroTagline } from '@/signals/weatherSignals';
import { RainCanvas } from '@/components/RainCanvas';
import { SearchBar } from '@/components/SearchBar';
import { venueCount, totalActivities } from '@/signals/venueSignals';
import { hasActiveFilters } from '@/signals/filterSignals';
import { Button } from '@/components/common/Button';
import styles from './Hero.module.css';

interface HeroProps {
  onCustomize: () => void;
  onFeelingLucky: () => void;
}

export function Hero({ onCustomize, onFeelingLucky }: HeroProps) {
  return (
    <section className={styles.hero} id="hero">
      <RainCanvas />
      <div className={styles.heroContent}>
        <span className={styles.wordmark}>Wet London</span>
        <h1 className={styles.tagline}>
          {heroTagline.value.lead}{' '}
          <em>{heroTagline.value.accent}</em>
        </h1>

        <div className={styles.searchSection}>
          <SearchBar />
          {/*
            The results grid sits about 5,000px down the page, below the mosaic
            and the category tiles. Typing changed it and nothing moved on
            screen, so search read as broken. This is the feedback at the point
            of typing, and the way down to what matched.
          */}
          {hasActiveFilters.value && (
            <button
              type="button"
              className={styles.resultCount}
              onClick={() => {
                document.getElementById('results')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              {venueCount.value === 0
                ? 'Nothing matches that yet. Try a different word.'
                : `${venueCount.value} of ${totalActivities.value} places match. Show me`}
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <Button onClick={onCustomize} variant="accent">
            Customise
          </Button>
          <Button onClick={onFeelingLucky} variant="secondary">
            🎲 Feeling lucky
          </Button>
        </div>
      </div>
    </section>
  );
}
