import Database from 'better-sqlite3';
import { carryVias, dayStops, locatedIds, seatAmong } from '../nest/accommodations/night-seat';

/**
 * Seat every booked night where its check-in says, the way a night booked today is
 * seated (night-seat.ts, the rule AccommodationsService applies).
 *
 * The stop a booking puts on its check-in day used to go last unless a stop pinned to
 * a later hour pulled it forward, and the backfill that gave older bookings their stop
 * appended it too. The night leads its day now: first, behind only a stop whose own
 * clock is at or before the check-in, with the stops that carry no hour following it.
 * Without this step every trip planned before the change keeps the old order until
 * somebody edits the check-in.
 *
 * Only the stops a booking owns move (accommodation_id). A stop the traveller placed
 * themselves and then booked a night on is theirs, wherever it sits. The drawn roads
 * (roadtrip_vias) are pinned to positions among the day's located stops and are
 * carried along by the rules the service applies (carryVias): a via follows the stop
 * it was drawn after, a via behind a stop that is last stays with it, and one left
 * without a leg goes.
 *
 * Runs inside the migration's transaction. Re-runnable: the nights of a day are taken
 * in the order the rule seats them (a night without a check-in first, then by
 * check-in, ties by booking), so one pass leaves every night in its seat and a second
 * pass moves nothing. Returns how many nights moved.
 */
export function reseatBookedNights(db: Database.Database): number {
  const nights = db.prepare(`
    SELECT da.id, da.day_id, a.id AS accommodation_id, a.check_in
    FROM day_assignments da
    JOIN day_accommodations a ON a.id = da.accommodation_id
    ORDER BY da.day_id, a.check_in IS NOT NULL, a.check_in, a.id
  `).all() as Array<{ id: number; day_id: number; accommodation_id: number; check_in: string | null }>;
  const setIndex = db.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ?');

  let seated = 0;
  const roads = { moved: 0, removed: 0 };
  for (const night of nights) {
    const rows = dayStops(db, night.day_id);
    const own = rows.findIndex((row) => row.id === night.id);
    if (own < 0) continue;
    const others = rows.filter((row) => row.id !== night.id);
    const seat = seatAmong(others, { id: night.accommodation_id, check_in: night.check_in });
    const next = [...others.slice(0, seat), rows[own], ...others.slice(seat)];
    if (next.every((row, i) => row.id === rows[i].id)) continue;

    next.forEach((row, i) => setIndex.run(i, row.id));
    seated += 1;
    const carried = carryVias(db, night.day_id, locatedIds(rows), locatedIds(next));
    if (carried) {
      roads.moved += carried.moved;
      roads.removed += carried.removed;
    }
  }
  if (roads.moved || roads.removed) {
    console.log(`[DB] Re-pinned ${roads.moved} drawn road(s) behind the reseated nights, dropped ${roads.removed} left without a leg`);
  }
  return seated;
}
