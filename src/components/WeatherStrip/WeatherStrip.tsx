import { useEffect } from 'preact/hooks';
import { weatherState, weatherMessage, weatherIcon } from '@/signals/weatherSignals';
import styles from './WeatherStrip.module.css';

const LONDON = { lat: 51.5074, lon: -0.1278 };
const API_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LONDON.lat}&longitude=${LONDON.lon}` +
  '&current=temperature_2m,apparent_temperature,weather_code,precipitation,relative_humidity_2m';

/**
 * A single slim line of live conditions, pinned under the nav. It rides the
 * header's hide-on-scroll, so it reads as a notice rather than another block
 * competing with the hero.
 *
 * Fixed London coordinates, the site never asks for the visitor's location.
 */
export function WeatherStrip() {
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) return;
        const { current } = await res.json();
        weatherState.value = {
          temp: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: Math.round(current.relative_humidity_2m),
          weatherCode: current.weather_code,
          isRaining: current.weather_code >= 50 || current.precipitation > 0,
        };
      } catch {
        // No weather is fine, the strip simply doesn't render
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const w = weatherState.value;
  if (!w) return null;

  return (
    <div className={styles.strip}>
      <span className={styles.now}>
        <span className={styles.icon} aria-hidden="true">{weatherIcon.value}</span>
        <strong>{w.temp}°</strong>
      </span>

      <span className={styles.facts}>
        <span><em>Feels</em> {w.feelsLike}°</span>
        <span><em>Humidity</em> {w.humidity}%</span>
        <span><em>Rain</em> {w.isRaining ? 'Yes' : 'No'}</span>
      </span>

      <span className={styles.line}>{weatherMessage.value}</span>
    </div>
  );
}
