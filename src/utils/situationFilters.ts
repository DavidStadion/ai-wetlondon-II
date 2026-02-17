import type { Venue, VenueType } from '@/types';

export type Situation = 'solo' | 'couple' | 'date' | 'friends' | 'group' | 'work' | 'kids' | 'quiet' | 'chaotic';

export const SITUATIONS: Array<{ value: Situation; label: string }> = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'date', label: 'Date' },
  { value: 'friends', label: 'Friends' },
  { value: 'group', label: 'Group' },
  { value: 'work', label: 'Work' },
  { value: 'kids', label: 'Kids' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'chaotic', label: 'Chaotic' },
];

export interface SituationMapping {
  include: VenueType[];
  exclude: VenueType[];
}

export const SITUATION_MAPPINGS: Record<Situation, SituationMapping> = {
  solo: { include: ['museums', 'galleries', 'historic', 'libraries', 'cafes'], exclude: ['bowling', 'club'] },
  couple: { include: ['spa', 'theatre', 'cinema', 'food', 'bars', 'views', 'cocktails'], exclude: [] },
  date: { include: ['spa', 'theatre', 'cinema', 'food', 'bars', 'cocktails', 'immersive'], exclude: ['kids'] },
  friends: { include: ['games', 'bowling', 'escape', 'immersive', 'comedy', 'food', 'bars'], exclude: [] },
  group: { include: ['games', 'bowling', 'escape', 'immersive', 'workshops', 'food'], exclude: [] },
  work: { include: ['cafes', 'libraries', 'museums', 'galleries', 'coworking'], exclude: ['bowling', 'comedy'] },
  kids: { include: ['kids', 'family', 'aquariums', 'science', 'museums', 'immersive'], exclude: ['cocktails', 'bars'] },
  quiet: { include: ['museums', 'galleries', 'historic', 'libraries'], exclude: ['comedy', 'bowling', 'club'] },
  chaotic: { include: ['comedy', 'immersive', 'games', 'bowling', 'escape', 'karaoke'], exclude: [] },
};

export function hasAnyType(venue: Venue, types: VenueType[]): boolean {
  return types.some((t) => venue.type.includes(t));
}

export function scoreVenue(venue: Venue, preferTypes: VenueType[]): number {
  let s = 0;
  if (typeof venue.rating === 'number') s += venue.rating;
  if (typeof venue.wetnessScore === 'number') s += (100 - venue.wetnessScore) / 25;
  if (preferTypes.length && hasAnyType(venue, preferTypes)) s += 2;
  if (venue.price === 0 || venue.priceDisplay?.toUpperCase() === 'FREE') s += 0.5;
  return s;
}

export function filterForSituation(sit: Situation | null, venueList: Venue[]): Venue[] {
  if (!sit) {
    return venueList.slice().sort((a, b) => scoreVenue(b, []) - scoreVenue(a, []));
  }

  const mapping = SITUATION_MAPPINGS[sit];

  const filtered = venueList.filter((v) => {
    const includeOk = !mapping.include.length || hasAnyType(v, mapping.include);
    const excludeOk = !mapping.exclude.length || !hasAnyType(v, mapping.exclude);
    return includeOk && excludeOk;
  });

  return filtered.sort((a, b) => scoreVenue(b, mapping.include) - scoreVenue(a, mapping.include));
}
