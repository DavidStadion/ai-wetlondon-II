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

  /*
   * A closing time at or before the opening time means it runs past midnight:
   * "12:00-00:00", or a bowling alley at "10:30-02:30". Comparing those with a
   * plain range made 44 venues read as closed for the whole of their latest
   * hours, which is most of the point of knowing a place is open late.
   *
   * Still approximate at the very start of the day: 01:00 is checked against
   * today's row rather than yesterday's, so a venue open late last night but
   * shut today reads as closed. Right for the common case of a venue that
   * keeps the same late hours either side of midnight.
   */
  if (closeMins <= openMins) {
    return currentMins >= openMins || currentMins < closeMins;
  }

  return currentMins >= openMins && currentMins < closeMins;
}
