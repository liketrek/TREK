import { ValidationError } from '../common/domain-errors';
import { MAX_TRIP_DAYS, tripSpanDays } from '@trek/shared';

/**
 * Pure helpers of the trips domain, moved out of trips.service.ts. Nothing
 * here touches the DB, so they stay plain exports rather than methods on
 * TripsService.
 */

/**
 * The date range is refused, not cut short: generateDays used to clip the day
 * rows at the limit while the trip kept its full end date, so everything past
 * the cut-off had dates but no day to go on (#2403). An inverted range is
 * refused here as well, because a start date moved past the stored end date
 * arrives on its own and would otherwise empty the trip.
 */
export function assertTripSpan(startDate: string, endDate: string) {
  const span = tripSpanDays(startDate, endDate);
  if (span < 1) throw new ValidationError('End date must be after start date');
  if (span > MAX_TRIP_DAYS) throw new ValidationError(`A trip can span at most ${MAX_TRIP_DAYS} days`);
}

/**
 * Strips `feed_token` from a trip row on its way out.
 *
 * The column is the sole credential for the anonymous /api/feed/trip/:token.ics
 * route, and `SELECT t.*` hands it to every reader of the trip. Gating the
 * token endpoint on `share_manage` means nothing while any member can read the
 * same value out of the trip payload, so the two go together. No TREK client
 * reads the field (it is absent from client/ and shared/ entirely).
 */
export function withoutFeedToken<T>(row: T): T {
  if (row && typeof row === 'object') delete (row as { feed_token?: unknown }).feed_token;
  return row;
}
