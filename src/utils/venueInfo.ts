import type { Venue, VenueType } from '@/types';
import { isVenueOpenNow } from '@/utils/openingHours';

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

  const stationPatterns = [
    /([A-Z][A-Za-z\s']+(?:Square|Street|Road|Bridge|Cross|Gate|Park|Hill|Station|Circus))\s+(?:station|tube|direct)/i,
    /([A-Z][A-Za-z\s']+)\s+(?:station|direct)/i,
    /from\s+([A-Z][A-Za-z\s']+)\s+station/i,
  ];

  for (const pattern of stationPatterns) {
    const match = description.match(pattern);
    if (match) {
      station = match[1].trim();
      break;
    }
  }

  if (/direct/i.test(description)) {
    details = 'Direct tube access - stay completely dry!';
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
    return '\u23F0 Full day experience (4+ hours recommended)';
  if (prerequisites?.includes('half day'))
    return '\u23F0 Half day visit (2-3 hours typical)';
  if (prerequisites?.includes('under 1 hour'))
    return '\u23F0 Quick visit (under 1 hour)';

  if (types.includes('museums') || types.includes('historic'))
    return '\u23F0 2-4 hours recommended to fully explore';
  if (types.includes('galleries'))
    return '\u23F0 1-3 hours depending on exhibitions';
  if (
    types.includes('theatre') ||
    types.includes('music') ||
    types.includes('comedy')
  )
    return '\u23F0 2-3 hours including intervals';
  if (types.includes('dining'))
    return '\u23F0 1-2 hours for a leisurely meal';
  if (types.includes('cinema'))
    return '\u23F0 2-3 hours including previews';
  if (types.includes('wellness'))
    return '\u23F0 1-3 hours depending on treatment';
  if (types.includes('shopping')) return '\u23F0 1-3 hours for browsing';
  if (types.includes('gaming') || types.includes('entertainment'))
    return '\u23F0 1-2 hours typical session';
  if (types.includes('workshops'))
    return '\u23F0 2-4 hours including instruction';

  return '\u23F0 1-3 hours typical visit';
}

export function getAccessibilityText(
  prerequisites?: string[],
  wetness?: string,
): string {
  const parts: string[] = [];

  if (prerequisites?.includes('wheelchair accessible'))
    parts.push('\u267F Wheelchair accessible');
  if (prerequisites?.includes('step-free'))
    parts.push('\u2713 Step-free access');
  if (prerequisites?.includes('lift access'))
    parts.push('\uD83D\uDED7 Lift available');

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
    return '\uD83D\uDCC5 Advance booking required - book online or by phone';
  if (prerequisites?.includes('walk-ins welcome'))
    return '\uD83D\uDEB6 Walk-ins welcome - no booking needed';

  if (
    types.includes('theatre') ||
    types.includes('music') ||
    types.includes('comedy')
  )
    return '\uD83C\uDFAB Tickets required - book in advance for best seats';
  if (types.includes('dining') && (price ?? 0) >= 30)
    return '\uD83C\uDF7D\uFE0F Booking recommended, especially for dinner service';
  if (types.includes('wellness'))
    return '\uD83D\uDCDE Advance booking required for treatments';
  if (price === 0)
    return '\uD83C\uDFAB Free entry - walk-ins welcome during opening hours';

  return '\uD83C\uDFAB Check availability online or contact venue';
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

  if (venue.wetness === 'dry')
    tips.push('\u2728 Direct tube access - stay completely dry!');
  else if (venue.wetness === 'slightly')
    tips.push(
      '\u2602\uFE0F 5-10 minute walk from station - bring an umbrella on rainy days',
    );
  else if (venue.wetness === 'wet')
    tips.push('\u2614 10+ minute walk - dress for the weather');

  if (venue.prerequisites?.includes('booking required'))
    tips.push('\uD83D\uDCC5 Book ahead to guarantee entry');
  else if (venue.prerequisites?.includes('walk-ins welcome'))
    tips.push('\uD83D\uDEB6 Walk-ins welcome - no booking needed');

  if (venue.price === 0) tips.push('\uD83C\uDFAB Free entry - donations welcome');
  else if (venue.price < 15) tips.push('\uD83D\uDCB7 Great value for money');
  else if (venue.price >= 50)
    tips.push('\uD83D\uDC8E Premium experience - worth the splurge');

  if (venue.prerequisites?.includes('child-friendly'))
    tips.push('\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66 Great for families and children');
  if (venue.prerequisites?.includes('photography allowed'))
    tips.push('\uD83D\uDCF8 Photography permitted - capture the memories!');
  if (venue.type.includes('museums') || venue.type.includes('galleries'))
    tips.push('\uD83C\uDFA8 Allow 2-3 hours to fully explore');
  if (venue.type.includes('dining'))
    tips.push(
      '\uD83C\uDF7D\uFE0F Consider booking for busy periods (lunch & dinner)',
    );
  if (
    venue.type.includes('theatre') ||
    venue.type.includes('music') ||
    venue.type.includes('comedy')
  )
    tips.push('\uD83C\uDFAD Check show times and book tickets in advance');
  if (venue.type.includes('wellness'))
    tips.push('\uD83D\uDC86 Arrive 10-15 minutes early to relax and prepare');
  if (venue.type.includes('nightlife'))
    tips.push('\uD83C\uDF19 Check opening hours - may vary by day of week');

  if (tips.length === 0) {
    tips.push(
      '\uD83C\uDF27\uFE0F Perfect rainy day activity',
      '\uD83D\uDE87 Easily accessible by London Underground',
      '\u23F0 Check opening times before visiting',
    );
  }

  return tips;
}
