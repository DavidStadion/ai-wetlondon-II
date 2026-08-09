import { useState, useEffect } from "preact/hooks";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { weatherState, weatherMessage } from "@/signals/weatherSignals";
import styles from "./WeatherWidget.module.css";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  rain: number;
  description: string;
  isRaining: boolean;
  weatherCode: number;
}

type LoadingState = "loading" | "success" | "error";

const LONDON_COORDS = { lat: 51.5074, lon: -0.1278 };
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LONDON_COORDS.lat}&longitude=${LONDON_COORDS.lon}&current=temperature_2m,apparent_temperature,weather_code,precipitation,relative_humidity_2m`;

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function getWeatherIcon(code: number): string {
  if (code === 0) return "\u2600\ufe0f"; // sun
  if (code <= 3) return "\u26c5"; // partly cloudy
  if (code <= 49) return "\ud83c\udf2b\ufe0f"; // fog
  if (code <= 69) return "\ud83c\udf27\ufe0f"; // rain
  if (code <= 79) return "\u2744\ufe0f"; // snow
  if (code <= 99) return "\u26a1"; // thunder
  return "\u2601\ufe0f"; // cloud
}

function getWeatherMessage(isRaining: boolean, temp: number): string {
  if (isRaining) {
    return "🌧️ It's raining! Perfect day for indoor activities";
  } else if (temp < 10) {
    return "🥶 Chilly outside - stay cozy indoors!";
  } else if (temp > 20) {
    return "☀️ Nice day, but plenty of indoor fun too!";
  } else {
    return "Perfect weather for exploring London indoors!";
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [state, setState] = useState<LoadingState>("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchWeather(signal?: AbortSignal) {
    try {
      const response = await fetch(API_URL, { signal });
      if (!response.ok) throw new Error("Weather fetch failed");

      const data = await response.json();
      const current = data.current;

      setWeather({
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: Math.round(current.relative_humidity_2m),
        rain: current.precipitation,
        description: getWeatherDescription(current.weather_code),
        isRaining: current.weather_code >= 50 || current.precipitation > 0,
        weatherCode: current.weather_code,
      });
      weatherState.value = {
        weatherCode: current.weather_code,
        isRaining: current.weather_code >= 50 || current.precipitation > 0,
        temp: Math.round(current.temperature_2m),
      };
      setState("success");
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState("error");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchWeather(controller.signal);
    return () => controller.abort();
  }, []);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    fetchWeather().finally(() => setRefreshing(false));
  }

  if (state === "loading") {
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

  if (state === "error") {
    return (
      <div className={styles.widget}>
        <p className={styles.error}>Unable to load weather</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className={`${styles.widget} ${weather.isRaining ? styles["widget--rainy"] : ""}`}
      aria-label={`Current weather in London: ${weather.temp} degrees, ${weather.description}`}
    >
      <button
        type="button"
        className={`${styles.refresh} ${refreshing ? styles.refreshing : ""}`}
        onClick={handleRefresh}
        aria-label="Refresh weather"
        disabled={refreshing}
      >
        ↻
      </button>

      <div className={styles.main}>
        <span className={styles.icon} aria-hidden="true">
          {getWeatherIcon(weather.weatherCode)}
        </span>
        <div className={styles.info}>
          <span className={styles.temp}>{weather.temp}<sup>°C</sup></span>
          <span className={styles.description}>{weather.description}</span>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Feels like</span>
          <span className={styles.value}>{weather.feelsLike}°C</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Humidity</span>
          <span className={styles.value}>{weather.humidity}%</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Rain</span>
          <span className={styles.value}>
            {weather.isRaining ? "Yes ☔" : "No ☀️"}
          </span>
        </div>
      </div>

      <div className={styles.message}>{weatherMessage.value}</div>

      {lastUpdated && (
        <div className={styles.updated}>Updated: {formatTime(lastUpdated)}</div>
      )}
    </div>
  );
}
