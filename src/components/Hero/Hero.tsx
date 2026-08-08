import { SearchBar } from '@/components/SearchBar';
import { WeatherWidget } from '@/components/WeatherWidget';
import { Button } from '@/components/common/Button';
import { weatherMessage, weatherIcon } from '@/signals/weatherSignals';
import styles from './Hero.module.css';

interface HeroProps {
  onCustomize: () => void;
  onFeelingLucky: () => void;
}

export function Hero({ onCustomize, onFeelingLucky }: HeroProps) {
  return (
    <section className={styles.hero} id="hero">
      {/* WeatherWidget stays mounted to fetch live conditions (drives the chip),
          but is visually hidden — the chip below is the editorial presentation. */}
      <div className={styles.weatherWrapper} aria-hidden="true">
        <WeatherWidget />
      </div>

      <div className={styles.heroContent}>
        {weatherMessage.value && (
          <div className={styles.weatherMessage}>
            <span className={styles.weatherMessageIcon}>{weatherIcon.value}</span>
            <span>{weatherMessage.value}</span>
          </div>
        )}
        {/* The wordmark lives in the header — no need to repeat it here. */}
        <h1 className={styles.tagline}>
          London ideas for when the weather is awful{' '}
          <br />
          and your <em>motivation is worse.</em>
        </h1>

        <div className={styles.searchSection}>
          <SearchBar />
        </div>

        <div className={styles.actions}>
          <Button onClick={onCustomize} variant="accent" size="lg">
            Customize your experience
          </Button>
          <Button onClick={onFeelingLucky} variant="secondary" size="lg">
            🎲 I'm feeling lucky
          </Button>
        </div>
      </div>
    </section>
  );
}
