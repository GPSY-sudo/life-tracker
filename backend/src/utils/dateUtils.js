// Helper to ensure dates are handled correctly as strings using local timezone (not UTC).
// Calendar dates in MiraiThread represent the user's local calendar day.
export const toISODate = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Check if a date is applicable for an activity based on:
 * 1. Date is within activity lifetime (startDate/endDate)
 * 2. Date's weekday is scheduled (if scheduledDays exists)
 * 3. Date is not inside a pause period (handled separately, not implemented yet)
 */
export const isDateApplicable = (dateStr, activity) => {
  // Check date range
  if (activity.startDate && dateStr < activity.startDate) return false;
  if (activity.endDate && dateStr > activity.endDate) return false;

  // Check pause periods
  if (isDatePaused(dateStr, activity)) return false;

  // Check schedule (if schedule exists, verify the weekday)
  if (activity.scheduledDays && activity.scheduledDays.length > 0) {
    // Parse as local date to check weekday in user's timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[date.getDay()];

    return activity.scheduledDays.includes(dayOfWeek);
  }

  // If no schedule is set, all days are applicable (backward compatible)
  return true;
};

/**
 * Check if a date is within a pause period for an activity.
 */
export const isDatePaused = (dateStr, activity) => {
  if (!activity.pausePeriods || activity.pausePeriods.length === 0) {
    return false;
  }

  for (const pause of activity.pausePeriods) {
    if (dateStr >= pause.startDate && dateStr <= pause.endDate) {
      return true;
    }
  }
  return false;
};