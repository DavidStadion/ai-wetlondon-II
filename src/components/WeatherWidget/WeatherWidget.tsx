import { useState, useEffect } from 'preact/hooks';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import styles from './WeatherWidget.module.css';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  isRaining: boolean;
  weatherCode: number;
}

type LoadingState = 'loading' | 'success' | 'error';

const LONDON_COORDS = { lat: 51.5074, lon: -0.1278 };
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LONDON_COORDS.lat}&longitude=${LONDON_COORDS.lon}&current=temperature_2m,apparent_temperature,weather_code,precipitation`;

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '\u2600\ufe0f'; // sun
  if (code <= 3) return '\u26c5'; // partly cloudy
  if (code <= 49) return '\ud83c\udf2b\ufe0f'; // fog
  if (code <= 69) return '\ud83c\udf27\ufe0f'; // rain
  if (code <= 79) return '\u2744\ufe0f'; // snow
  if (code <= 99) return '\u26a1'; // thunder
  return '\u2601\ufe0f'; // cloud
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [state, setState] = useState<LoadingState>('loading');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const current = data.current;

        setWeather({
          temp: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          description: getWeatherDescription(current.weather_code),
          isRaining: current.weather_code >= 50 || current.precipitation > 0,
          weatherCode: current.weather_code,
        });
        setState('success');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setState('error');
      }
    }

    fetchWeather();

    return () => {
      controller.abort();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className={styles.widget}>
        <div className={styles.loadingContent}>
          <SkeletonLoader variant="circle" width="3rem" height="3rem" />
          <div className={styles.loadingText}>
            <SkeletonLoader variant="text" width="4rem" />
            <SkeletonLoader variant="text" width="6rem" />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.widget}>
        <p className={styles.error}>Unable to load weather</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className={`${styles.widget} ${weather.isRaining ? styles['widget--rainy'] : ''}`}
      aria-label={`Current weather in London: ${weather.temp} degrees, ${weather.description}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {getWeatherIcon(weather.weatherCode)}
      </span>
      <div className={styles.details}>
        <span className={styles.temp}>{weather.temp}°C</span>
        <span className={styles.description}>{weather.description}</span>
        <span className={styles.feelsLike}>Feels like {weather.feelsLike}°C</span>
      </div>
    </div>
  );
}
