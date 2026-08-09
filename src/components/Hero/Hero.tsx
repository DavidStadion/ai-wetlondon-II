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
      <div className={styles.heroContent}>
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
            Customise your experience
          </Button>
          <Button onClick={onFeelingLucky} variant="secondary" size="lg">
            🎲 I'm feeling lucky
          </Button>
        </div>
      </div>

      {/* Live London conditions — the site's whole premise, stated plainly */}
      <div className={styles.weatherBand}>
        <WeatherWidget />
      </div>
    </section>
  );
}
