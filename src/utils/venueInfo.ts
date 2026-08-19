import type { Venue, VenueType } from '@/types';
import { isVenueOpenNow } from '@/utils/openingHours';
import { wetnessBand } from './wetness';

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export function formatOpeningHours(
  hours: Record<string, string> | null | undefined,
): string {
  if (!hours) return 'Hours not available - please check venue website';

  const lines = DAY_ORDER.filter((day) => hours[day]).map(
    (day) => `${DAY_LABELS[day]}: ${hours[day]}`,
  );

  return lines.length > 0
    ? lines.join('\n')
    : 'Hours not available - please check venue website';
}

export function getOpenStatus(
  hours: Record<string, string> | null | undefined,
): string {
  const status = isVenueOpenNow(hours);
  if (status === true) return 'Open now';
  if (status === false) return 'Closed';
  return '';
}

export function getGoogleMapsUrl(venueName: string, location: string): string {
  const query = encodeURIComponent(`${venueName}, ${location} London`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getTransportInfo(description: string): {
  details: string;
  station: string;
} {
  let station = 'Check venue for details';
  let details = 'Easily accessible by tube';

  /*
   * A station name is one to three capitalised words. These patterns are
   * deliberately case-sensitive: with /i the [A-Z] stopped meaning "capitalised"
   * and the greedy [A-Za-z\s']+ swallowed whole clauses, so one venue's station
   * read "Bouldering and ropes inside a mock Victorian castle that used to be a
   * pumping" and another read "min walk from Southwark".
   */
  const NAME = "[A-Z][A-Za-z']*(?:\\s+[A-Z][A-Za-z']*){0,2}";
  const stationPatterns = [
    new RegExp(`from\\s+(${NAME})\\s+[Ss]tation`),
    new RegExp(`(${NAME})\\s+(?:[Ss]tation|[Tt]ube|direct|Direct)`),
    // Last, because most descriptions name the stop and the walk without ever
    // saying "station", as in "Leicester Square 4 min walk". Without this, 90%
    // of venues fell back to "Check venue for details" with the stop right
    // there in the text.
    new RegExp(`(${NAME})\\s+\\d+\\s*min`),
  ];

  for (const pattern of stationPatterns) {
    const match = description.match(pattern);
    if (!match) continue;
    // "Direct Russell Square station" names the station, not a "Direct" one,
    // and "Direct tube access" names no station at all.
    const name = match[1].replace(/^Direct\s+/, '').trim();
    if (!name || name === 'Direct') continue;
    station = name;
    break;
  }

  /*
   * Says what it knows about the transport and nothing about the weather. This
   * promised "stay completely dry!" on any description containing "direct",
   * which included Little Venice (45%, canal walks, badged "Bring a brolly")
   * and Tower Bridge, where the word was "the river directly beneath your
   * shoes". How wet you get is the band's job, and the band reads the score.
   */
  if (/\bdirect\b/i.test(description)) {
    details = 'Direct access from the station';
  } else if (description.includes('min')) {
    const timeMatch = description.match(/(\d+)\s*min/);
    if (timeMatch) {
      details = `${timeMatch[1]} minute walk from station`;
    }
  }

  return { details, station };
}

export function getDuration(
  types: VenueType[],
  prerequisites?: string[],
): string {
  if (prerequisites?.includes('full day'))
    return 'Full day experience (4+ hours recommended)';
  if (prerequisites?.includes('half day'))
    return 'Half day visit (2-3 hours typical)';
  if (prerequisites?.includes('under 1 hour'))
    return 'Quick visit (under 1 hour)';

  if (types.includes('museums') || types.includes('historic'))
    return '2-4 hours recommended to fully explore';
  if (types.includes('galleries'))
    return '1-3 hours depending on exhibitions';
  if (
    types.includes('theatre') ||
    types.includes('music') ||
    types.includes('comedy')
  )
    return '2-3 hours including intervals';
  if (types.includes('dining'))
    return '1-2 hours for a leisurely meal';
  if (types.includes('cinema'))
    return '2-3 hours including previews';
  if (types.includes('wellness'))
    return '1-3 hours depending on treatment';
  if (types.includes('shopping')) return '1-3 hours for browsing';
  if (types.includes('gaming') || types.includes('entertainment'))
    return '1-2 hours typical session';
  if (types.includes('workshops'))
    return '2-4 hours including instruction';

  return '1-3 hours typical visit';
}

export function getAccessibilityText(
  prerequisites?: string[],
  wetness?: string,
): string {
  const parts: string[] = [];

  if (prerequisites?.includes('wheelchair accessible'))
    parts.push('Wheelchair accessible');
  if (prerequisites?.includes('step-free'))
    parts.push('Step-free access');
  if (prerequisites?.includes('lift access'))
    parts.push('Lift available');

  if (parts.length === 0) {
    parts.push('Please contact venue for accessibility information');
    if (wetness === 'dry') {
      parts.push('Direct station access likely has step-free options');
    }
  }

  return parts.join(' \u2022 ');
}

export function getBookingText(
  types: VenueType[],
  prerequisites?: string[],
  price?: number,
): string {
  if (prerequisites?.includes('booking required'))
    return 'Advance booking required - book online or by phone';
  if (prerequisites?.includes('walk-ins welcome'))
    return 'Walk-ins welcome - no booking needed';

  if (
    types.includes('theatre') ||
    types.includes('music') ||
    types.includes('comedy')
  )
    return 'Tickets required - book in advance for best seats';
  if (types.includes('dining') && (price ?? 0) >= 30)
    return 'Booking recommended, especially for dinner service';
  if (types.includes('wellness'))
    return 'Advance booking required for treatments';
  if (price === 0)
    return 'Free entry - walk-ins welcome during opening hours';

  return 'Check availability online or contact venue';
}

export function getWhatsIncluded(
  types: VenueType[],
  prerequisites?: string[],
): string[] {
  const highlights: string[] = [];

  if (types.includes('museums'))
    highlights.push(
      'Permanent collection access',
      'Educational exhibits',
      'Audio guide available',
    );
  if (types.includes('galleries'))
    highlights.push(
      'Curated art collections',
      'Rotating exhibitions',
      'Gallery talks',
    );
  if (types.includes('dining'))
    highlights.push(
      'Full menu',
      'Indoor seating',
      'Dietary options available',
    );
  if (types.includes('theatre'))
    highlights.push(
      'Live performance',
      'Professional production',
      'Theatre seating',
    );
  if (types.includes('entertainment'))
    highlights.push(
      'Indoor activities',
      'Modern facilities',
      'Group bookings available',
    );
  if (types.includes('cinema'))
    highlights.push(
      'Multiple screens',
      'Comfortable seating',
      'Concessions available',
    );
  if (types.includes('wellness'))
    highlights.push(
      'Professional treatments',
      'Relaxing environment',
      'Expert staff',
    );
  if (types.includes('shopping'))
    highlights.push('Wide selection', 'Indoor browsing', 'Various retailers');
  if (types.includes('nightlife'))
    highlights.push('Licensed bar', 'Entertainment', 'Late opening');
  if (types.includes('music'))
    highlights.push('Live music', 'Quality sound system', 'Bar available');
  if (types.includes('comedy'))
    highlights.push('Live comedy acts', 'Bar service', 'Intimate venue');
  if (types.includes('gaming'))
    highlights.push(
      'Modern gaming equipment',
      'Private sessions',
      'Instruction provided',
    );
  if (types.includes('workshops'))
    highlights.push(
      'Expert instruction',
      'All materials included',
      'Small group sizes',
    );
  if (types.includes('sports'))
    highlights.push(
      'Professional equipment',
      'Changing facilities',
      'Instruction available',
    );
  if (types.includes('historic'))
    highlights.push(
      'Historic building',
      'Guided tours available',
      'Educational information',
    );
  if (types.includes('exhibitions'))
    highlights.push(
      'Immersive experience',
      'Modern technology',
      'Photo opportunities',
    );

  if (prerequisites?.includes('cafe on-site'))
    highlights.push('On-site caf\u00E9');
  if (prerequisites?.includes('toilets available'))
    highlights.push('Facilities available');
  if (prerequisites?.includes('gift shop'))
    highlights.push('Gift shop');
  if (prerequisites?.includes('lockers available'))
    highlights.push('Secure storage');

  if (highlights.length === 0)
    highlights.push('Indoor venue', 'Professional service', 'Great atmosphere');

  return highlights;
}

export function getGoodToKnow(venue: Venue): string[] {
  const tips: string[] = [];

  /*
   * From the score, not the legacy venue.wetness column. That column is set
   * independently of the score and contradicts it on 123 of 341 venues, so this
   * used to promise "Direct tube access - stay completely dry!" on venues that
   * are a five minute walk across open ground.
   */
  tips.push(`${wetnessBand(venue.wetnessScore).blurb}.`);

  if (venue.prerequisites?.includes('booking required'))
    tips.push('Book ahead to guarantee entry');
  else if (venue.prerequisites?.includes('walk-ins welcome'))
    tips.push('Walk-ins welcome - no booking needed');

  if (venue.price === 0) tips.push('Free entry - donations welcome');
  else if (venue.price < 15) tips.push('Great value for money');
  else if (venue.price >= 50)
    tips.push('Premium experience - worth the splurge');

  if (venue.prerequisites?.includes('child-friendly'))
    tips.push('Great for families and children');
  if (venue.prerequisites?.includes('photography allowed'))
    tips.push('Photography permitted - capture the memories!');
  if (venue.type.includes('museums') || venue.type.includes('galleries'))
    tips.push('Allow 2-3 hours to fully explore');
  if (venue.type.includes('dining'))
    tips.push(
      'Consider booking for busy periods (lunch & dinner)',
    );
  if (
    venue.type.includes('theatre') ||
    venue.type.includes('music') ||
    venue.type.includes('comedy')
  )
    tips.push('Check show times and book tickets in advance');
  if (venue.type.includes('wellness'))
    tips.push('Arrive 10-15 minutes early to relax and prepare');
  if (venue.type.includes('nightlife'))
    tips.push('Check opening hours - may vary by day of week');

  if (tips.length === 0) {
    tips.push(
      'Perfect rainy day activity',
      'Easily accessible by London Underground',
      'Check opening times before visiting',
    );
  }

  return tips;
}
