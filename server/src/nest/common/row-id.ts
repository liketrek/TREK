// The rule itself lives in the data layer, so a repository that still takes a
// request's string id reads it the same way (src/db sits below src/nest).
import { toRowId, withRowId } from '../../db/row-id';

export { toRowId, withRowId };

/**
 * The text the legacy raw-SQL layer stored for an `accommodation_id` bound
 * as a plain JS number. `better-sqlite3` binds every JS `number` as a SQLite
 * REAL, whole or not (`typeof(?)` reports 'real'), and SQLite stores a
 * numeric value written into a TEXT column as its text form, so `14` was
 * stored as `'14.0'`, never `'14'`. `String(id)` gives `'14'`, a different
 * stored shape, and a read held to the legacy compare (`reservationStayIs`,
 * which `restampLinkedReservation` uses) would miss every row written that
 * way.
 *
 * Use this wherever a `number` id is written into the `accommodation_id`
 * TEXT column, so the stored text matches what the legacy statement stored
 * for the same input; never `String(id)` for that column. The reads go
 * through src/db/repositories/_shared/reservation-accommodation.ts, which
 * compares this column the same way on both engines; this helper is for
 * writes only.
 */
export function legacyBoundIntegerText(id: number): string {
  return `${id}.0`;
}

/**
 * An id variable of an MCP resource URI (`trek://trips/{tripId}/...`), one
 * value or the first of a list, as a positive row id, or null. Read through
 * toRowId: Number() took '0x1' and '1e0' for 1 and passed 1e20 to Postgres,
 * which refuses it as out of range for bigint.
 */
export function uriRowId(value: string | string[]): number | null {
  const id = toRowId(Array.isArray(value) ? value[0] : value);
  return id !== null && id > 0 ? id : null;
}
