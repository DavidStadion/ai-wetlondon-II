import { heroTagline } from '@/signals/weatherSignals';
import { RainCanvas } from '@/components/RainCanvas';
import { SearchBar } from '@/components/SearchBar';
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
        {/* The wordmark lives in the header, no need to repeat it here. */}
        <h1 className={styles.tagline}>
          {heroTagline.value.lead}{' '}
          <em>{heroTagline.value.accent}</em>
        </h1>

        <div className={styles.searchSection}>
          <SearchBar />
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
