import { computed } from '@preact/signals';
import { ActivityCard } from '@/components/ActivityCard';
import { Carousel } from '@/components/common/Carousel';
import { weatherState } from '@/signals/weatherSignals';
import { venues } from '@/signals/venueSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import type { Venue, VenueType } from '@/types';
import styles from './WeatherRecommendations.module.css';

interface WeatherConfig {
  title: string;
  subtitle: string;
  filter: (v: Venue) => boolean;
}

const COZY_TYPES: VenueType[] = ['dining', 'cinema', 'wellness', 'cafes', 'spa'];
const LIGHT_TYPES: VenueType[] = ['galleries', 'shopping', 'exhibitions', 'museums'];

function getWeatherConfig(isRaining: boolean, temp: number): WeatherConfig {
  if (isRaining) {
    return {
      title: 'Perfect for Rainy Weather',
      subtitle: 'Stay completely dry at these venues',
      filter: (v) => v.wetness === 'dry',
    };
  }

  if (temp < 10) {
    return {
      title: 'Cozy Indoor Escapes',
      subtitle: 'Warm up at these comfortable venues',
      filter: (v) => v.wetness === 'dry' && v.type.some((t) => COZY_TYPES.includes(t)),
    };
  }

  if (temp > 20) {
    return {
      title: 'Light & Bright Activities',
      subtitle: 'Cool indoor spaces to enjoy today',
      filter: (v) =>
        (v.wetness === 'dry' || v.wetness === 'slightly') &&
        v.type.some((t) => LIGHT_TYPES.includes(t)),
    };
  }

  return {
    title: 'Top Indoor Attractions',
    subtitle: 'Highest rated indoor activities',
    filter: (v) => v.rating >= 4.5,
  };
}

const weatherRecommendations = computed(() => {
  const weather = weatherState.value;
  const allVenues = venues.value;
  if (!weather || allVenues.length === 0) return null;

  const config = getWeatherConfig(weather.isRaining, weather.temp);
  let filtered = allVenues.filter(config.filter);

  // Cold weather fallback: widen to all dry venues if too few results
  if (weather.temp < 10 && !weather.isRaining && filtered.length < 3) {
    filtered = allVenues.filter((v) => v.wetness === 'dry');
  }

  const sorted = [...filtered].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return sorted.length > 0 ? { title: config.title, subtitle: config.subtitle, venues: sorted } : null;
});

export function WeatherRecommendations() {
  const data = weatherRecommendations.value;
  if (!data) return null;

  const handleCardClick = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </div>
        <Carousel perView={4} ariaLabel={data.title}>
          {data.venues.map((venue, index) => (
            <ActivityCard
              key={`weather-${venue.name}-${index}`}
              venue={venue}
              onClick={() => handleCardClick(venue)}
            />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
