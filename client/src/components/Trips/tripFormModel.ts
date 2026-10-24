import { MAX_TRIP_DAYS, addIsoDays, tripSpanDays } from '@trek/shared';

type T = (key: string, params?: Record<string, string | number>) => string;

interface TripFormFields {
  title: string;
  startDate: string;
  endDate: string;
}

/**
 * Why the title and range of the trip form cannot be saved, or '' when they can.
 * Only a range being set is held to the limit, as on the server: a trip that
 * already carries a longer one can still be renamed.
 */
export function tripFormError(
  { title, startDate, endDate }: TripFormFields,
  trip: { start_date?: string | null; end_date?: string | null } | null,
  t: T
): string {
  if (!title.trim()) return t('dashboard.titleRequired');
  if (startDate && endDate) {
    const span = tripSpanDays(startDate, endDate);
    if (span < 1) return t('dashboard.endDateError');
    const datesTouched = !trip || startDate !== (trip.start_date || '') || endDate !== (trip.end_date || '');
    if (datesTouched && span > MAX_TRIP_DAYS) return t('dashboard.tripTooLong', { count: MAX_TRIP_DAYS });
  }
  return '';
}

/**
 * The end date the phone sheet shows after the start moved to `value`: a valid
 * range keeps its length, an end before the new start follows it.
 */
export function endDateForNewStart(startDate: string, endDate: string, value: string): string {
  if (value && endDate && startDate && endDate >= startDate) {
    // Counted in UTC calendar days: a local-time shift across a DST change used to
    // drop or add a day.
    return addIsoDays(value, tripSpanDays(startDate, endDate) - 1);
  }
  if (value && (!endDate || endDate < value)) return value;
  return endDate;
}
