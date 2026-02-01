/**
 * Format price for display.
 * Returns "FREE" for 0, otherwise "£X".
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'FREE';
  return `£${price}`;
}

/**
 * Format rating for display.
 * Returns rating with one decimal place.
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Truncate text to specified length, adding ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Format opening hours for display.
 * Returns human-readable string for today's hours.
 */
export function formatOpeningHours(
  hours: Record<string, string> | null | undefined
): string {
  if (!hours) return 'Hours not available';

  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const today = days[new Date().getDay()];
  const todayHours = hours[today];

  if (!todayHours) return 'Hours not available';
  if (todayHours.toLowerCase() === 'closed') return 'Closed today';

  return `Today: ${todayHours}`;
}

/**
 * Check if venue is currently open based on opening hours.
 */
export function isOpenNow(
  hours: Record<string, string> | null | undefined
): boolean {
  if (!hours) return false;

  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const now = new Date();
  const today = days[now.getDay()];
  const todayHours = hours[today];

  if (!todayHours || todayHours.toLowerCase() === 'closed') return false;

  // Parse "HH:MM-HH:MM" format
  const match = todayHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return false;

  const [, openH, openM, closeH, closeM] = match;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseInt(openH, 10) * 60 + parseInt(openM, 10);
  const closeMinutes = parseInt(closeH, 10) * 60 + parseInt(closeM, 10);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Format category label from key.
 * Converts snake_case to Title Case.
 */
export function labelCategory(categoryKey: string): string {
  if (!categoryKey) return '';
  return String(categoryKey)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
