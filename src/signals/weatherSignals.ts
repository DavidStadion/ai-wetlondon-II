import { signal, computed } from '@preact/signals';

export interface WeatherState {
  weatherCode: number;
  isRaining: boolean;
  temp: number;
}

export const weatherState = signal<WeatherState | null>(null);

/**
 * What kind of day is it working against?
 *
 * The site is named for rain, but the useful idea is broader: London weather
 * being against you. A heatwave sends people indoors exactly like a downpour
 * does, and the venue data already supports it — a 0% wetness score means fully
 * indoors, which is also fully shaded.
 */
export type WeatherMood = 'storm' | 'rain' | 'snow' | 'fog' | 'freezing' | 'heat' | 'fine' | 'dull';

export const weatherMood = computed<WeatherMood | null>(() => {
  const w = weatherState.value;
  if (!w) return null;

  const { weatherCode: code, isRaining, temp } = w;

  // Specific codes first — the previous ordering made the snow branch unreachable
  if (code >= 95) return 'storm';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80) return 'rain';          // heavy showers
  if (isRaining || (code >= 51 && code <= 67)) return 'rain';
  if (code >= 45 && code <= 48) return 'fog';

  if (temp <= 4) return 'freezing';
  if (temp >= 26) return 'heat';
  if (code <= 3 && temp >= 18) return 'fine';
  return 'dull';
});

export const weatherMessage = computed<string | null>(() => {
  const w = weatherState.value;
  const mood = weatherMood.value;
  if (!w || !mood) return null;

  const temp = Math.round(w.temp);

  switch (mood) {
    case 'storm': return 'Wild out there. Get somewhere with a roof';
    case 'rain': return "It's chucking it down. Perfect timing";
    case 'snow': return 'Snow day. Somewhere warm, then';
    case 'fog': return "Can't see a thing. Try indoors";
    case 'freezing': return `${temp}° and biting. Warm up inside`;
    case 'heat': return temp >= 30
      ? `${temp}° out there. Get in the shade`
      : `${temp}° and climbing. Somewhere cool?`;
    case 'fine': return 'Lovely out — but we know some good indoor ones';
    default: return 'Grey one. Plenty to do inside';
  }
});

export const weatherIcon = computed<string | null>(() => {
  const mood = weatherMood.value;
  if (!mood) return null;

  switch (mood) {
    case 'storm': return '⚡';
    case 'rain': return '🌧️';
    case 'snow': return '❄️';
    case 'fog': return '🌫️';
    case 'freezing': return '🥶';
    case 'heat': return '🔥';
    case 'fine': return '☀️';
    default: return '⛅';
  }
});
