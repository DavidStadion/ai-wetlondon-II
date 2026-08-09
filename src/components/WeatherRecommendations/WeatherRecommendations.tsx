import { computed } from '@preact/signals';
import { ActivityCard } from '@/components/ActivityCard';
import { Carousel } from '@/components/common/Carousel';
import { weatherState, weatherMood } from '@/signals/weatherSignals';
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
/** Reliably cool and usually air-conditioned. */
const COOL_TYPES: VenueType[] = ['museums', 'galleries', 'cinema', 'libraries', 'shopping', 'wellness'];

function getWeatherConfig(mood: string | null, temp: number): WeatherConfig {
  if (mood === 'heat') {
    return {
      title: temp >= 30 ? 'Escape the heat' : 'Cool, dark and quiet',
      subtitle: 'Air-conditioned, shaded, and blissfully out of the sun',
      // A 0% wetness score means fully indoors — which is also fully shaded
      filter: (v) => v.wetnessScore <= 15 && v.type.some((t) => COOL_TYPES.includes(t)),
    };
  }

  if (mood === 'rain' || mood === 'storm') {
    return {
      title: 'Stay completely dry',
      subtitle: "Not a drop on you between the station and the door",
      filter: (v) => v.wetness === 'dry',
    };
  }

  if (mood === 'freezing' || mood === 'snow') {
    return {
      title: 'Somewhere warm',
      subtitle: 'Thaw out properly',
      filter: (v) => v.wetness === 'dry' && v.type.some((t) => COZY_TYPES.includes(t)),
    };
  }

  return {
    title: 'Top indoor picks',
    subtitle: 'The highest rated places to be inside',
    filter: (v) => v.rating >= 4.5 && v.rating <= 5,
  };
}

const weatherRecommendations = computed(() => {
  const weather = weatherState.value;
  const allVenues = venues.value;
  if (!weather || allVenues.length === 0) return null;

  const config = getWeatherConfig(weatherMood.value, weather.temp);
  let filtered = allVenues.filter(config.filter);

  // Whatever the weather, never show a thin rail — widen to anywhere indoors
  if (filtered.length < 4) {
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
