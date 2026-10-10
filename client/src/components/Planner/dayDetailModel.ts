import type { Accommodation, Reservation } from '../../types';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * The bookings of a day, hotels aside (they have their own block): the ones hanging
 * on one of the day's stops and the ones booked on the day itself.
 */
export function dayBookings<R extends Pick<Reservation, 'type' | 'assignment_id' | 'day_id'>>(
  dayId: number,
  dayAssignments: { id: number }[],
  reservations: R[]
): R[] {
  return reservations.filter((r) => {
    if (r.type === 'hotel') return false;
    if (r.assignment_id && dayAssignments.some((a) => a.id === r.assignment_id)) return true;
    return r.day_id === dayId;
  });
}

/** A forecast temperature (always in °C from the API) rounded in the user's unit. */
export function toDisplayTemp(celsius: number | undefined, fahrenheit: boolean): number {
  return Math.round(fahrenheit ? ((celsius ?? Number.NaN) * 9) / 5 + 32 : (celsius ?? Number.NaN));
}

/** What a stay means for the day: check-in, check-out, both, or nothing (a night in between). */
export function stayDayLabel(
  acc: Pick<Accommodation, 'start_day_id' | 'end_day_id'>,
  dayId: number | undefined,
  t: Translate
): string | null {
  const checksIn = acc.start_day_id === dayId;
  const checksOut = acc.end_day_id === dayId;
  if (checksIn && checksOut) return `${t('day.checkIn')} & ${t('day.checkOut')}`;
  if (checksIn) return t('day.checkIn');
  if (checksOut) return t('day.checkOut');
  return null;
}
