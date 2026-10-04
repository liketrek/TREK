import Database from 'better-sqlite3';
import { locatedIds, planViaCarry, sameOrder, seatAmong, type PinnedVia, type SeatRow } from '../nest/accommodations/night-seat';

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
 * carried along by the rules the service applies (planViaCarry): a via follows the
 * stop it was drawn after, a via behind a stop that is last stays with it, and one
 * left without a leg goes.
 *
 * Runs inside the migration's transaction, over the raw connection: the rule is
 * night-seat.ts's, the statements are this file's, the way the services' are their
 * repositories'. Re-runnable: the nights of a day are taken in the order the rule
 * seats them (a night without a check-in first, then by check-in, ties by booking),
 * so one pass leaves every night in its seat and a second pass moves nothing. Returns
 * how many nights moved.
 */
export function reseatBookedNights(db: Database.Database): number {
  const nights = db.prepare(`
    SELECT da.id, da.day_id, a.id AS accommodation_id, a.check_in
    FROM day_assignments da
    JOIN day_accommodations a ON a.id = da.accommodation_id
    ORDER BY da.day_id, a.check_in IS NOT NULL, a.check_in, a.id
  `).all() as Array<{ id: number; day_id: number; accommodation_id: number; check_in: string | null }>;
  // A day's stops as the rule sees them (SeatRow): the same statement
  // DayAssignmentsRepository.listSeatRows (AC7) runs for the services.
  const dayStops = db.prepare(`
    SELECT da.id, da.order_index,
           CASE WHEN other.id IS NULL THEN COALESCE(da.assignment_time, p.place_time) ELSE other.check_in END AS at,
           other.id AS night_id, (p.lat IS NOT NULL AND p.lng IS NOT NULL) AS located
    FROM day_assignments da JOIN places p ON p.id = da.place_id
    LEFT JOIN day_accommodations other ON other.id = da.accommodation_id
    WHERE da.day_id = ?
    ORDER BY da.order_index ASC, da.created_at ASC, da.id ASC
  `);
  const setIndex = db.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ?');
  const viasOf = db.prepare('SELECT id, after_order_index, sequence FROM roadtrip_vias WHERE day_id = ?');
  const dropVia = db.prepare('DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?');
  const moveVia = db.prepare('UPDATE roadtrip_vias SET after_order_index = ? WHERE id = ? AND day_id = ?');
  const setSequence = db.prepare('UPDATE roadtrip_vias SET sequence = ? WHERE id = ? AND day_id = ?');

  let seated = 0;
  const roads = { moved: 0, removed: 0 };
  for (const night of nights) {
    const rows = dayStops.all(night.day_id) as SeatRow[];
    const own = rows.findIndex((row) => row.id === night.id);
    if (own < 0) continue;
    const others = rows.filter((row) => row.id !== night.id);
    const seat = seatAmong(others, { id: night.accommodation_id, check_in: night.check_in });
    const next = [...others.slice(0, seat), rows[own], ...others.slice(seat)];
    if (next.every((row, i) => row.id === rows[i].id)) continue;

    next.forEach((row, i) => setIndex.run(i, row.id));
    seated += 1;

    const before = locatedIds(rows);
    const after = locatedIds(next);
    if (sameOrder(before, after)) continue;
    const plan = planViaCarry(viasOf.all(night.day_id) as PinnedVia[], before, after);
    if (!plan) continue;
    for (const viaId of plan.remove) dropVia.run(viaId, night.day_id);
    for (const via of plan.moved) moveVia.run(via.after_order_index, via.id, night.day_id);
    for (const via of plan.resequence) setSequence.run(via.sequence, via.id, night.day_id);
    roads.moved += plan.moved.length;
    roads.removed += plan.remove.length;
  }
  if (roads.moved || roads.removed) {
    console.log(`[DB] Re-pinned ${roads.moved} drawn road(s) behind the reseated nights, dropped ${roads.removed} left without a leg`);
  }
  return seated;
}
