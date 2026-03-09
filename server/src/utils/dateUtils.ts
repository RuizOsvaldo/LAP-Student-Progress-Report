/** Returns the ISO date string (YYYY-MM-DD) for the Monday of the current week (UTC). */
export function currentWeekMonday(): string {
  return lastMondayOnOrBefore(new Date());
}

/**
 * Returns the ISO date string (YYYY-MM-DD) of the last Monday on or before
 * the given date. If the date is itself a Monday, returns that date.
 */
export function lastMondayOnOrBefore(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Given a YYYY-MM string, returns the ISO date of the last Monday on or
 * before the last day of that month.
 */
export function lastMondayOfMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0); // day 0 of next month = last day of this month
  return lastMondayOnOrBefore(lastDay);
}
