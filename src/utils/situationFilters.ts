import type { Venue } from '@/types';
import { canonicalType } from './venueTypes';

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

/*
 * string[], not VenueType[], and deliberately so. The VenueType union has 35
 * members; the table holds 71 distinct tags. Ten union members (aquariums, bars,
 * bowling, club, cocktails, coworking, escape, karaoke, kids, spa) appear on no
 * venue at all, and they are precisely the block commented "Extended types for
 * situations filtering", which is how these lists came to be written against
 * tags nothing carried. Forty-six real tags are missing from the union.
 *
 * Typing these as VenueType would only let the union keep vetoing the tags that
 * actually exist. Reconciling Venue.type with the database is a separate job.
 */
export interface SituationMapping {
  include: string[];
  exclude: string[];
}

/*
 * Repaired against the types that actually exist in the table.
 *
 * Ten of the twenty-five types these lists referenced were not in the data at
 * all: aquariums, bars, bowling, club, cocktails, coworking, escape, karaoke,
 * kids and spa. So 125 of 341 venues matched no situation whatsoever and
 * /situations was filtering on tags nothing carried. Each dead tag is replaced
 * by the one the data really uses (spa is wellness, kids is family, bars is bar
 * and drinks, escape is escape rooms, bowling is sports and activities), and
 * `date` can now genuinely exclude the family venues it was trying to.
 *
 * Matching goes through canonicalType, so the 22 venues tagged `games` and the
 * 21 tagged `gaming` both count once, which the raw string compare missed.
 */
export const SITUATION_MAPPINGS: Record<Situation, SituationMapping> = {
  solo: {
    include: ['museums', 'galleries', 'historic', 'libraries', 'cafes', 'exhibitions', 'art', 'books'],
    exclude: ['nightlife', 'bar'],
  },
  couple: {
    include: ['wellness', 'theatre', 'cinema', 'dining', 'drinks', 'bar', 'views', 'music'],
    exclude: [],
  },
  date: {
    include: ['wellness', 'theatre', 'cinema', 'dining', 'drinks', 'bar', 'immersive', 'music'],
    exclude: ['family'],
  },
  friends: {
    include: ['gaming', 'sports', 'activities', 'escape rooms', 'puzzles', 'immersive', 'comedy', 'dining', 'drinks', 'bar', 'arcade'],
    exclude: [],
  },
  group: {
    include: ['gaming', 'sports', 'activities', 'escape rooms', 'puzzles', 'immersive', 'workshops', 'dining', 'team', 'group'],
    exclude: [],
  },
  work: {
    include: ['cafes', 'libraries', 'museums', 'galleries'],
    exclude: ['nightlife', 'bar', 'comedy'],
  },
  kids: {
    include: ['family', 'science', 'museums', 'immersive', 'toys', 'activities'],
    exclude: ['nightlife', 'bar', 'drinks'],
  },
  quiet: {
    include: ['museums', 'galleries', 'historic', 'libraries', 'books', 'quiet'],
    exclude: ['comedy', 'nightlife', 'arcade'],
  },
  chaotic: {
    include: ['comedy', 'immersive', 'gaming', 'sports', 'escape rooms', 'nightlife', 'arcade', 'late'],
    exclude: [],
  },
};

export function hasAnyType(venue: Venue, types: readonly string[]): boolean {
  const mine = new Set(venue.type.map((t) => canonicalType(t)));
  return types.some((t) => mine.has(canonicalType(t)));
}

export function scoreVenue(venue: Venue, preferTypes: readonly string[]): number {
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

/**
 * Which situations a venue qualifies for, using the same include/exclude test
 * filterForSituation applies. Sharing the predicate is the point: a card that
 * says "good for a date" and a /situations page that omits it would be two
 * answers to one question.
 */
export function situationsFor(venue: Venue): Situation[] {
  return SITUATIONS.filter(({ value }) => {
    const m = SITUATION_MAPPINGS[value];
    return (
      (!m.include.length || hasAnyType(venue, m.include)) &&
      (!m.exclude.length || !hasAnyType(venue, m.exclude))
    );
  }).map((s) => s.value);
}
