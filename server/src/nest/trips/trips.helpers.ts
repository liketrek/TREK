import { ValidationError } from '../common/domain-errors';
import { MAX_TRIP_DAYS, tripSpanDays, type PermissionKey } from '@trek/shared';

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

/** The fields of a trip update that count as an edit, as against archiving it or changing its cover. */
const TRIP_EDIT_FIELDS = ['title', 'description', 'start_date', 'end_date', 'currency', 'reminder_days', 'day_count'];

/**
 * The permissions a trip update needs, in the order PUT /api/trips/:id checks
 * them, each with the refusal that route answers. Archiving and the cover have
 * their own action; any other field present is an edit. update_trip runs the
 * same list, so an MCP caller cannot archive a trip or swap its cover on the
 * strength of trip_edit alone.
 */
export function tripUpdatePermissions(body: object): { action: PermissionKey; refusal: string }[] {
  const sent = (field: string) => (body as Record<string, unknown>)[field] !== undefined;
  const needed: { action: PermissionKey; refusal: string }[] = [];
  if (sent('is_archived')) {
    needed.push({ action: 'trip_archive', refusal: 'No permission to archive/unarchive this trip' });
  }
  if (sent('cover_image')) {
    needed.push({ action: 'trip_cover_upload', refusal: 'No permission to change cover image' });
  }
  if (TRIP_EDIT_FIELDS.some(sent)) needed.push({ action: 'trip_edit', refusal: 'No permission to edit this trip' });
  return needed;
}
