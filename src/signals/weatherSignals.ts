import { signal, computed } from '@preact/signals';

export interface WeatherState {
  weatherCode: number;
  isRaining: boolean;
  temp: number;
}

export const weatherState = signal<WeatherState | null>(null);

export const weatherMessage = computed<string | null>(() => {
  const w = weatherState.value;
  if (!w) return null;

  const { weatherCode, isRaining, temp } = w;

  if (weatherCode >= 80) return 'Storm brewing! Stay cosy indoors';
  if (isRaining || weatherCode >= 50) return 'Perfect day to explore indoors!';
  if (weatherCode >= 70) return 'Snow day! Warm up inside';
  if (weatherCode >= 40) return 'Foggy out there. Find something indoors';
  if (temp < 5) return 'Freezing out! Warm up with indoor fun';
  if (weatherCode <= 3 && temp > 18) return 'Nice day but we have indoor ideas too';
  if (weatherCode <= 3) return 'Clouds rolling in. Plan your indoor escape';

  return 'Check out what\'s on indoors today';
});

export const weatherIcon = computed<string | null>(() => {
  const w = weatherState.value;
  if (!w) return null;

  const code = w.weatherCode;
  if (code === 0) return '\u2600\ufe0f';
  if (code <= 3) return '\u26c5';
  if (code <= 49) return '\ud83c\udf2b\ufe0f';
  if (code <= 69) return '\ud83c\udf27\ufe0f';
  if (code <= 79) return '\u2744\ufe0f';
  if (code <= 99) return '\u26a1';
  return '\u2601\ufe0f';
});
