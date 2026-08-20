/**
 * The colour a venue is, by category.
 *
 * Written for the image placeholder, where it is the ground behind a ghosted
 * initial. The swipe feed uses the same palette full-bleed, so it lives here
 * rather than inside the hook: two consumers, one palette, and a museum is the
 * same navy in both places.
 *
 * Every tone clears 12:1 against white text, so card copy is safe on any of
 * them whatever category a venue turns out to be.
 */
import type { VenueType } from '@/types/venue';

export const VENUE_TONES: Partial<Record<VenueType, string>> = {
  museums: '#141c33',
  galleries: '#221528',
  exhibitions: '#1b1630',
  historic: '#241c12',
  libraries: '#0f2229',
  theatre: '#26161a',
  cinema: '#131a2b',
  music: '#122420',
  comedy: '#231a10',
  dining: '#231a14',
  markets: '#1a2114',
  shopping: '#201628',
  nightlife: '#25151f',
  wellness: '#102422',
  sports: '#0f2225',
  gaming: '#181632',
  entertainment: '#1a1730',
  workshops: '#13221a',
};

/** Falls back to a neutral ink for categories with no tone of their own. */
export function toneFor(types: VenueType[] | undefined): string {
  return (types?.[0] && VENUE_TONES[types[0]]) || '#17181d';
}
