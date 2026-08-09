import { signal, computed } from '@preact/signals';

export interface WeatherState {
  weatherCode: number;
  isRaining: boolean;
  temp: number;
  feelsLike: number;
  humidity: number;
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

/**
 * Several lines per mood, picked once per page load. The tone is dry and a bit
 * self-aware — on a genuinely lovely day the site should admit it has nothing
 * to offer rather than pretend otherwise.
 */
const LINES: Record<WeatherMood, string[]> = {
  storm: [
    'Wild out there. Get somewhere with a roof',
    'Genuinely grim. Come inside',
    'Nature having a moment. Sit this one out',
  ],
  rain: [
    "It's chucking it down. Perfect timing",
    'Absolutely biblical. You’re welcome',
    'Rain. This is our moment',
    'Finally, weather we can work with',
    'Wet one. Funnily enough, we have thoughts',
  ],
  snow: [
    'Snow day. Somewhere warm, then',
    'London has completely stopped. Might as well go somewhere',
    'Two flakes and chaos. Standard',
  ],
  fog: [
    "Can't see a thing. Try indoors",
    'Proper pea-souper. Atmospheric, but cold',
    'Visibility: poor. Ambitions: indoors',
  ],
  freezing: [
    'Biting out there. Warm up inside',
    'Baltic. Find a radiator with a gift shop',
    'Too cold to be brave about it',
  ],
  heat: [
    'Get in the shade',
    'Frankly, too hot. Inside?',
    'London was not built for this. Find air conditioning',
    'Somewhere cool, before you melt',
  ],
  fine: [
    'Beautiful day. What is the point of us?',
    'Gorgeous out. Go on, we’ll wait here',
    'Genuinely lovely. Our whole business model, ruined',
    'No notes on this weather. Outside, honestly',
    'Sunny. Awkward, for a site called Wet London',
  ],
  dull: [
    'Grey one. Plenty to do inside',
    'Classic London nothing-weather',
    'Neither one thing nor the other. Inside, then',
    'Overcast and undecided. We can help with that',
  ],
};

// Stable for the life of the page, so the line doesn't flicker on re-render
const pick = Math.random();

function lineFor(mood: WeatherMood): string {
  const options = LINES[mood];
  return options[Math.floor(pick * options.length)];
}

export const weatherMessage = computed<string | null>(() => {
  const w = weatherState.value;
  const mood = weatherMood.value;
  if (!w || !mood) return null;

  const temp = Math.round(w.temp);
  const line = lineFor(mood);

  // Temperature leads when it's the story
  if (mood === 'heat') return `${temp}° out there. ${line}`;
  if (mood === 'freezing') return `${temp}° and ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
  return line;
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
