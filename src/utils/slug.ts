import type { Venue } from '@/types';

/**
 * URL-safe slug for a venue name.
 * "Sir John Soane's Museum" -> "sir-john-soanes-museum"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/['’]/g, '')              // drop apostrophes rather than hyphenating them
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function venueUrl(venue: Venue): string {
  return `/venue/${slugify(venue.name)}`;
}

/** Names aren't guaranteed unique, so take the first match deterministically. */
export function findVenueBySlug(list: Venue[], slug: string): Venue | undefined {
  const target = slug.toLowerCase();
  return list.find((v) => slugify(v.name) === target);
}
