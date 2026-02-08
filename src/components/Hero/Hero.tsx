import { SearchBar } from '@/components/SearchBar';
import { WeatherWidget } from '@/components/WeatherWidget';
import { Button } from '@/components/common/Button';
import styles from './Hero.module.css';

interface HeroProps {
  onCustomize: () => void;
  onFeelingLucky: () => void;
}

export function Hero({ onCustomize, onFeelingLucky }: HeroProps) {
  return (
    <section className={styles.hero} id="hero">
      {/* Rain Animation */}
      <div className={styles.rain}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className={styles.rainDrop} />
        ))}
      </div>

      {/* Weather Widget - positioned absolutely */}
      <div className={styles.weatherWrapper}>
        <WeatherWidget />
      </div>

      <div className={styles.heroContent}>
        <h1 className={styles.title}>Wet London.</h1>
        <p className={styles.tagline}>
          London ideas for when the weather is awful and your motivation is worse.
        </p>

        <div className={styles.searchSection}>
          <SearchBar />
        </div>

        <div className={styles.actions}>
          <Button onClick={onCustomize} variant="accent" size="lg">
            Customize Your Experience
          </Button>
          <Button onClick={onFeelingLucky} variant="secondary" size="lg">
            🎲 I'm Feeling Lucky
          </Button>
        </div>
      </div>
    </section>
  );
}
