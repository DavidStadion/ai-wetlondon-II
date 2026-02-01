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
    <section className={styles.hero}>
      {/* Rain Animation */}
      <div className={styles.rain}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className={styles.rainDrop} />
        ))}
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroTop}>
          <div className={styles.branding}>
            <h1 className={styles.title}>Wet London.</h1>
            <p className={styles.tagline}>
              London ideas for when the weather is awful...
            </p>
          </div>
          <WeatherWidget />
        </div>

        <div className={styles.searchSection}>
          <SearchBar />
        </div>

        <div className={styles.actions}>
          <Button onClick={onCustomize} variant="accent">
            Customize Your Experience
          </Button>
          <Button onClick={onFeelingLucky} variant="secondary">
            I'm Feeling Lucky
          </Button>
        </div>
      </div>
    </section>
  );
}
