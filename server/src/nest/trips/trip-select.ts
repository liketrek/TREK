/**
 * The trip row in list shape, and the one field that must never leave with it.
 *
 * A leaf on purpose: it imports nothing. TripsService imports DaysService, so a
 * day write that has to hand its collaborators the changed trip (a day deleted
 * off the end of a dated trip shortens it) cannot import trips.service.ts
 * without closing a module cycle. Reading the same query from here keeps the
 * two surfaces from drifting apart instead of copying it into the days domain.
 */

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
  if (row && typeof row === 'object') delete (row as Record<string, unknown>).feed_token;
  return row;
}

// `NULL AS feed_token` after `t.*` rather than an explicit column list: the
// duplicate name wins in the row object, so the credential is blanked once here
// instead of at each of the nine call sites, and the next migration that adds a
// column does not have to remember to extend a hand-maintained list.
export const TRIP_SELECT = `
  SELECT t.*,
    NULL AS feed_token,
    (SELECT COUNT(*) FROM days d WHERE d.trip_id = t.id) as day_count,
    (SELECT COUNT(*) FROM places p WHERE p.trip_id = t.id) as place_count,
    CASE WHEN t.user_id = :userId THEN 1 ELSE 0 END as is_owner,
    u.username as owner_username,
    (SELECT COUNT(*) FROM trip_members tm WHERE tm.trip_id = t.id) as shared_count
  FROM trips t
  JOIN users u ON u.id = t.user_id
`;
