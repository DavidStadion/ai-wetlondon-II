/**
 * Check if a venue is currently open based on opening hours.
 * Returns true (open), false (closed), or null (unknown/no hours data).
 */
export function isVenueOpenNow(
  openingHours: Record<string, string> | null | undefined
): boolean | null {
  if (!openingHours) return null;

  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[now.getDay()];
  const hours = openingHours[today];

  if (!hours || hours === 'Closed') return false;
  if (hours === '24/7') return true;

  const [openTime, closeTime] = hours.split('-');
  if (!openTime || !closeTime) return null;

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  return currentMins >= openMins && currentMins < closeMins;
}
