import { signal, computed } from '@preact/signals';
import type { Venue } from '@/types';
import {
  keywords,
  selectedTypes,
  selectedAreas,
  wetnessLevel,
  maxWetnessScore,
  openNow,
  constraints,
} from './filterSignals';

export const venues = signal<Venue[]>([]);
export const isLoading = signal<boolean>(true);
export const error = signal<string | null>(null);

export const filteredVenues = computed(() => {
  let result = venues.value;

  // Filter by keywords
  const searchTerm = keywords.value.toLowerCase().trim();
  if (searchTerm) {
    result = result.filter(
      (v) =>
        v.name.toLowerCase().includes(searchTerm) ||
        v.description.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by types
  if (selectedTypes.value.size > 0) {
    result = result.filter((v) =>
      v.type.some((t) => selectedTypes.value.has(t))
    );
  }

  // Filter by areas
  if (selectedAreas.value.size > 0) {
    result = result.filter((v) => selectedAreas.value.has(v.location));
  }

  // Filter by wetness level
  if (wetnessLevel.value !== null) {
    result = result.filter((v) => v.wetness === wetnessLevel.value);
  }

  // Filter by max wetness score
  if (maxWetnessScore.value < 100) {
    result = result.filter((v) => v.wetnessScore <= maxWetnessScore.value);
  }

  // Filter by open now
  if (openNow.value) {
    result = result.filter((v) => {
      if (!v.openingHours) return false;
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[now.getDay()];
      const hours = v.openingHours[today];
      if (!hours || hours === 'Closed') return false;

      const [open, close] = hours.split('-');
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const openTime = parseInt(open.replace(':', ''), 10);
      const closeTime = parseInt(close.replace(':', ''), 10);

      return currentTime >= openTime && currentTime <= closeTime;
    });
  }

  // Filter by constraints (prerequisites)
  if (constraints.value.size > 0) {
    result = result.filter((v) =>
      v.prerequisites?.some((p) => constraints.value.has(p)) ?? false
    );
  }

  return result;
});

export const venueCount = computed(() => filteredVenues.value.length);
