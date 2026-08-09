import { signal, computed } from '@preact/signals';
import type { VenueType, AreaType, WetnessLevel } from '@/types';

export const keywords = signal<string>('');
export const selectedTypes = signal<Set<VenueType>>(new Set());
export const selectedAreas = signal<Set<AreaType>>(new Set());
export const wetnessLevel = signal<WetnessLevel | null>(null);
export const maxWetnessScore = signal<number>(100);
export const openNow = signal<boolean>(false);
export const maxPrice = signal<number | null>(null);   // null = any price
export const constraints = signal<Set<string>>(new Set());

export const filterCounts = computed(() => ({
  types: selectedTypes.value.size,
  areas: selectedAreas.value.size,
  constraints: constraints.value.size,
  hasWetness: wetnessLevel.value !== null,
  hasOpenNow: openNow.value,
}));

export const hasActiveFilters = computed(() => {
  if (maxPrice.value !== null) return true;
  const counts = filterCounts.value;
  return (
    counts.types > 0 ||
    counts.areas > 0 ||
    counts.constraints > 0 ||
    counts.hasWetness ||
    counts.hasOpenNow ||
    keywords.value.trim() !== ''
  );
});

export function clearAllFilters(): void {
  maxPrice.value = null;
  keywords.value = '';
  selectedTypes.value = new Set();
  selectedAreas.value = new Set();
  wetnessLevel.value = null;
  maxWetnessScore.value = 100;
  openNow.value = false;
  constraints.value = new Set();
  isDateFilter.value = false;
}

export function toggleType(type: VenueType): void {
  const current = new Set(selectedTypes.value);
  if (current.has(type)) {
    current.delete(type);
  } else {
    current.add(type);
  }
  selectedTypes.value = current;
}

export function toggleArea(area: AreaType): void {
  const current = new Set(selectedAreas.value);
  if (current.has(area)) {
    current.delete(area);
  } else {
    current.add(area);
  }
  selectedAreas.value = current;
}

export function toggleConstraint(constraint: string): void {
  const current = new Set(constraints.value);
  if (current.has(constraint)) {
    current.delete(constraint);
  } else {
    current.add(constraint);
  }
  constraints.value = current;
}

export function setTypeFilter(type: VenueType): void {
  selectedTypes.value = new Set([type]);
}

export const DATE_NIGHT_TYPES: VenueType[] = [
  'dining', 'theatre', 'comedy', 'music', 'cocktails', 'cinema',
];

export const isDateFilter = signal<boolean>(false);

export function toggleDateFilter(): void {
  const active = isDateFilter.value;
  if (active) {
    const current = new Set(selectedTypes.value);
    DATE_NIGHT_TYPES.forEach((t) => current.delete(t));
    selectedTypes.value = current;
    isDateFilter.value = false;
  } else {
    const current = new Set(selectedTypes.value);
    DATE_NIGHT_TYPES.forEach((t) => current.add(t));
    selectedTypes.value = current;
    isDateFilter.value = true;
  }
}

export function clearQuickFilters(): void {
  isDateFilter.value = false;
}
