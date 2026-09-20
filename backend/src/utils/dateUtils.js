// Helper to ensure dates are handled correctly as strings and no timezone shifting occurs.
export const toISODate = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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
    const date = new Date(dateStr + 'T00:00:00Z');
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[date.getUTCDay()];

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