export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opts,
  });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getMonthName(month: number): string {
  return new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function isSameDay(d1: string, d2: string): boolean {
  return d1 === d2;
}

export function isToday(date: string): boolean {
  return date === todayISO();
}

export function isFuture(date: string): boolean {
  return date > todayISO();
}

export function isPast(date: string): boolean {
  return date < todayISO();
}

export function getDayName(date: string | Date, short = false): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
}

export function getDayNumber(date: string | Date): number {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.getDate();
}

export function getGreeting(username?: string): string {
  const h = new Date().getHours();
  const name = username || '';
  const suffix = name ? `, ${name}! ` : ' ';
  
  if (h >= 5 && h < 12) return `Good Morning${suffix}🌅`;
  if (h >= 12 && h < 17) return `Good Afternoon${suffix}☀️`;
  if (h >= 17 && h < 21) return `Good Evening${suffix}🌆`;
  return `Hope you're having a peaceful night${suffix}🌙`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatSessionDuration(minutes: number): string {
  // Format focus session duration as human-readable string
  // Handles fractional minutes for short focus sessions (< 1 minute)
  
  if (minutes < 0.0167) {
    // Less than 1 second, shouldn't happen but handle gracefully
    return '0s';
  }
  
  if (minutes < 1) {
    // Convert to seconds
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  
  // 1 minute or more: show minutes and seconds
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = Math.round((minutes - wholeMinutes) * 60);
  
  if (remainingSeconds === 0) {
    return `${wholeMinutes}m`;
  }
  
  return `${wholeMinutes}m ${remainingSeconds}s`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimeFromDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function addDays(date: string, days: number): string {
  const d = parseISODate(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function startOfWeek(date: string): string {
  const d = parseISODate(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function getWeekDates(date: string): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Check if a date is applicable for an activity based on:
 * 1. Date is within activity lifetime (startDate/endDate)
 * 2. Date's weekday is scheduled (if scheduledDays exists)
 */
export function isDateApplicable(date: string, activity: { startDate?: string; endDate?: string; scheduledDays?: string[]; pausePeriods?: Array<{ startDate: string; endDate: string }> }): boolean {
  // Check date range
  if (activity.startDate && date < activity.startDate) return false;
  if (activity.endDate && date > activity.endDate) return false;

  // Check pause periods
  if (isDatePaused(date, activity)) return false;

  // Check schedule (if schedule exists, verify the weekday)
  if (activity.scheduledDays && activity.scheduledDays.length > 0) {
    const d = parseISODate(date);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[d.getDay()];

    return activity.scheduledDays.includes(dayOfWeek);
  }

  // If no schedule is set, all days are applicable (backward compatible)
  return true;
}

/**
 * Check if a date is within a pause period for an activity.
 */
export function isDatePaused(date: string, activity: { pausePeriods?: Array<{ startDate: string; endDate: string }> }): boolean {
  if (!activity.pausePeriods || activity.pausePeriods.length === 0) {
    return false;
  }

  for (const pause of activity.pausePeriods) {
    if (date >= pause.startDate && date <= pause.endDate) {
      return true;
    }
  }
  return false;
}
