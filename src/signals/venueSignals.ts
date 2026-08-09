import { signal, computed } from '@preact/signals';
import type { Venue } from '@/types';
import { isVenueOpenNow } from '@/utils/openingHours';
import {
  keywords,
  selectedTypes,
  selectedAreas,
  wetnessLevel,
  maxWetnessScore,
  openNow,
  constraints,
  maxPrice,
} from './filterSignals';

/** Ratings outside 0-5 are data errors; treat them as unrated when sorting. */
function validRating(v: Venue): number {
  const r = v.rating;
  return typeof r === 'number' && r > 0 && r <= 5 ? r : 0;
}

export const venues = signal<Venue[]>([]);
export const isLoading = signal<boolean>(true);
export const error = signal<string | null>(null);

export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'wetness-asc' | 'wetness-desc' | 'rating-desc';
export const sortOption = signal<SortOption>('name-asc');

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

  // Filter by max price
  if (maxPrice.value !== null) {
    result = result.filter((v) => v.price <= (maxPrice.value as number));
  }

  // Filter by open now
  if (openNow.value) {
    result = result.filter((v) => isVenueOpenNow(v.openingHours) === true);
  }

  // Filter by constraints (prerequisites)
  if (constraints.value.size > 0) {
    result = result.filter((v) =>
      v.prerequisites?.some((p) => constraints.value.has(p)) ?? false
    );
  }

  // Sort
  const sort = sortOption.value;
  result = [...result].sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'wetness-asc': return a.wetnessScore - b.wetnessScore;
      case 'wetness-desc': return b.wetnessScore - a.wetnessScore;
      case 'rating-desc': return (validRating(b) - validRating(a));
      default: return 0;
    }
  });

  return result;
});

export const venueCount = computed(() => filteredVenues.value.length);

export const sortedVenues = computed(() => {
  const sort = sortOption.value;
  return [...venues.value].sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'wetness-asc': return a.wetnessScore - b.wetnessScore;
      case 'wetness-desc': return b.wetnessScore - a.wetnessScore;
      case 'rating-desc': return (validRating(b) - validRating(a));
      default: return 0;
    }
  });
});

export const totalActivities = computed(() => venues.value.length);

export const openNowCount = computed(() =>
  venues.value.filter((v) => isVenueOpenNow(v.openingHours) === true).length
);

export const freeEntryCount = computed(() =>
  venues.value.filter((v) => v.price === 0).length
);

export const highlightedVenues = computed(() =>
  venues.value.filter((v) => v.highlighted).slice(0, 3)
);
