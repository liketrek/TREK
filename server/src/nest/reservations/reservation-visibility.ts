/**
 * Which reservation rows a viewer without a TREK session may see.
 *
 * `ingest_state` is 'live' for everything a person put on a trip, and 'staged'
 * for a row an automated ingest parked for review. Only the two anonymous
 * exports filter on it. The authenticated lists deliberately do not: the
 * staging inbox has to see its own rows, or nobody can confirm them.
 *
 * These are SQL fragments rather than a service. calendar/ and share/ are
 * separate modules and neither should have to import the other for a WHERE
 * clause. They take the table alias because share.service.ts queries
 * `reservations` without one while calendar.service.ts uses `r`.
 *
 * The COALESCE guards a NULL in the column, not a missing column: a table
 * without `ingest_state` fails the query outright rather than returning NULL.
 * The migration adds the column NOT NULL DEFAULT 'live', so a NULL should not
 * occur; the COALESCE costs nothing and keeps a row that predates a botched
 * ALTER visible rather than silently dropping it out of a live calendar feed.
 */
export const publicReservationSql = (alias = 'r'): string => `COALESCE(${alias}.ingest_state, 'live') <> 'staged'`;

/**
 * A stay is public when nothing points at it (somebody added it by hand), or
 * when a live booking does. Both halves matter: a plain EXISTS would drop every
 * hand-added hotel out of trips that are shared today.
 *
 * `accommodation_id` is a TEXT column that reads back as "14.0", hence the
 * CAST. Same coercion as reservations.service.ts.
 */
export const publicStaySql = (alias = 'a'): string => `(
      NOT EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id)
      OR EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id
                   AND ${publicReservationSql('vr')})
    )`;
