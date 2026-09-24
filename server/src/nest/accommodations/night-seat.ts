import type Database from 'better-sqlite3';
import { seamViaIndex } from '@trek/shared/roadtrip';

/**
 * Where a booked night sits in its day, and how the drawn roads follow when a stop
 * moves.
 *
 * One rule, applied by everything that seats a night: AccommodationsService when a
 * night is booked or edited, DaysService when a trip's dates move and carry the
 * night to another day row, and the migration that brought the trips planned under
 * the old rule along. Written over the connection's `prepare` so a raw better-sqlite3
 * handle fits as well as DatabaseService. Everything here runs inside the caller's
 * transaction.
 */
export interface SeatConnection {
  prepare(sql: string): Database.Statement;
}

/** A stop of one day as the rule sees it: the clock it is measured by (dayStops), the
 *  booking that owns it, and whether the router counts it. */
export interface SeatRow {
  id: number;
  order_index: number;
  at: string | null;
  night_id: number | null;
  located: number;
}

/** The booking whose stop is being seated. */
export interface Night {
  id: number;
  check_in: string | null | undefined;
}

/** A via as the re-pinning reads it: where it is pinned and its place on that leg. */
interface PinnedVia {
  id: number;
  after_order_index: number;
  sequence: number;
}

/**
 * A day's stops in order, each with the hour it is measured by: the visit's own, else
 * the place's.
 *
 * A stop a booking owns is measured by that booking's check-in instead, and by nothing
 * else. That is the value the night seats itself by, so it has to be the value its
 * peers see as well: read the same row as an hour pinned on the stop and the two nights
 * of a day would answer the question differently depending on which of them is asking,
 * and a pass that seats them both would never settle.
 */
export function dayStops(db: SeatConnection, dayId: number): SeatRow[] {
  return db.prepare(`
    SELECT da.id, da.order_index,
           CASE WHEN other.id IS NULL THEN COALESCE(da.assignment_time, p.place_time) ELSE other.check_in END AS at,
           other.id AS night_id, (p.lat IS NOT NULL AND p.lng IS NOT NULL) AS located
    FROM day_assignments da JOIN places p ON p.id = da.place_id
    LEFT JOIN day_accommodations other ON other.id = da.accommodation_id
    WHERE da.day_id = ?
    ORDER BY da.order_index ASC, da.created_at ASC, da.id ASC
  `).all(dayId) as SeatRow[];
}

/** The stops the router counts, in day order: the positions the vias are pinned to. */
export function locatedIds(rows: readonly SeatRow[]): number[] {
  return rows.filter(row => row.located).map(row => row.id);
}

export function locatedStopIds(db: SeatConnection, dayId: number): number[] {
  return locatedIds(dayStops(db, dayId));
}

/**
 * Whether `row` stands ahead of the night on its day.
 *
 * The night leads its day: the hotel is where the day is based, and the stops placed
 * without an hour follow from there. Only a stop with a clock of its own stands ahead
 * of it, and only when that clock is at or before the check-in: a stop pinned to eight
 * with a check-in at ten puts the night second, one pinned to the afternoon does not.
 *
 * Two nights on one day settle by their check-ins. When those agree, or both are
 * missing, the earlier booking leads; without that each would count the other as
 * ahead and the pair would trade places on every pass. A night without a check-in
 * leads the day outright, ahead of one with a clock.
 *
 * Among the nights of a day that is a strict order: the ones without a check-in by
 * booking, then the rest by check-in and booking. What each of them counts as ahead
 * grows along that order, which is what lets a caller seat a whole day's nights in
 * one pass and find them all settled (reseat-booked-nights.ts).
 */
export function standsAhead(row: SeatRow, night: Night): boolean {
  const earlierBooking = row.night_id !== null && row.night_id < night.id;
  if (!night.check_in) return row.at === null && earlierBooking;
  if (row.at === null) return row.night_id !== null;
  if (row.at === night.check_in) return row.night_id === null || earlierBooking;
  return row.at < night.check_in;
}

/** The position among `others` (the day's stops without the night's own) the night
 *  takes: right behind the last row that stands ahead of it, else first. */
export function seatAmong(others: readonly SeatRow[], night: Night): number {
  let seat = 0;
  others.forEach((row, i) => {
    if (standsAhead(row, night)) seat = i + 1;
  });
  return seat;
}

/**
 * The order_index a fresh insert of the night gets, with everything from there on
 * moved down (AssignmentsService.createAssignment). `excludeId` leaves the night's
 * own row out of the chain it is measured against: without it a night parked at
 * the end of the day can find itself.
 */
export function seatIndex(db: SeatConnection, dayId: number, night: Night, excludeId?: number): number {
  const others = dayStops(db, dayId).filter(row => row.id !== excludeId);
  const seat = seatAmong(others, night);
  return seat === 0 ? 0 : others[seat - 1].order_index + 1;
}

/**
 * Whether the night already sits somewhere its check-in allows, on an edit that did
 * not touch the check-in.
 *
 * Read off the chain rather than recomputed, because the index a fresh insert would
 * get is not the index this row occupies. Two ways to be wrong: something with a
 * later hour ahead of it, or something with an earlier one behind it. Stops without
 * an hour are passed over in both directions, and so is another night with the same
 * check-in: the two may have been dragged into this order on purpose, and a change
 * of notes is no reason to undo that.
 */
export function seatHolds(rows: readonly SeatRow[], ownId: number, checkIn: string | null | undefined): boolean {
  if (!checkIn) return true;
  const own = rows.findIndex(row => row.id === ownId);
  if (own < 0) return true;
  const laterAhead = rows.slice(0, own).some(row => row.at !== null && row.at > checkIn);
  const earlierBehind = rows.slice(own + 1).some(row =>
    row.at !== null && (row.night_id === null ? row.at <= checkIn : row.at < checkIn));
  return !laterAhead && !earlierBehind;
}

/**
 * Carry a night's own stop to `dayId` in place, seated where its check-in says.
 *
 * The gap it leaves on the day it came from is closed. Then it is parked at the end
 * of the target day and seated the way a fresh insert would be: two steps, because
 * the index it should get is read off a chain it is not part of yet.
 */
export function reseatOwnStop(
  db: SeatConnection,
  stop: { id: number; day_id: number; order_index: number },
  placeId: number,
  dayId: number,
  night: Night,
): void {
  db.prepare('UPDATE day_assignments SET order_index = order_index - 1 WHERE day_id = ? AND order_index > ?')
    .run(stop.day_id, stop.order_index);
  const max = db.prepare('SELECT MAX(order_index) AS max FROM day_assignments WHERE day_id = ? AND id != ?')
    .get(dayId, stop.id) as { max: number | null };
  const end = (max.max !== null ? max.max : -1) + 1;
  db.prepare('UPDATE day_assignments SET day_id = ?, place_id = ?, order_index = ? WHERE id = ?').run(dayId, placeId, end, stop.id);

  const seat = seatIndex(db, dayId, night, stop.id);
  if (seat < end) {
    db.prepare('UPDATE day_assignments SET order_index = order_index + 1 WHERE day_id = ? AND order_index >= ? AND id != ?')
      .run(dayId, seat, stop.id);
    db.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ?').run(seat, stop.id);
  }
}

/**
 * Keep every drawn road behind the stop it was drawn after, now that a write has
 * seated, moved or taken out a stop on this day. `previousIds` and `nextIds` are the
 * located stops in order before and after: the index space the vias are pinned to.
 *
 * The rules the planner applies when a stop is dragged or taken out: a via follows
 * its stop, a stop that left the day hands its road to the stop before it, and a
 * stop that is last has no leg to keep a via on. A via behind the day's last stop
 * bends the drive into the next day: it stays with that stop while it is still last,
 * whatever its number is now, and goes once another stop is last, because it lies on
 * the road to tomorrow and no leg of the day. That rule is the planner's own
 * (`seamViaIndex`), so the two cannot disagree about it.
 *
 * Returns what changed, or null when nothing did.
 */
export function carryVias(db: SeatConnection, dayId: number, previousIds: number[], nextIds: number[]): { moved: number; removed: number } | null {
  if (previousIds.length === nextIds.length && previousIds.every((id, i) => id === nextIds[i])) return null;
  const vias = db.prepare('SELECT id, after_order_index, sequence FROM roadtrip_vias WHERE day_id = ?').all(dayId) as PinnedVia[];
  if (!vias.length) return null;

  const remove: number[] = [];
  const moved: { id: number; after_order_index: number }[] = [];
  for (const via of vias) {
    const seam = seamViaIndex(via.after_order_index, previousIds, nextIds);
    const next = seam !== undefined ? seam : legAfter(via.after_order_index, previousIds, nextIds);
    if (next === null) remove.push(via.id);
    else if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  if (!remove.length && !moved.length) return null;

  for (const viaId of remove) db.prepare('DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?').run(viaId, dayId);
  for (const via of moved) {
    db.prepare('UPDATE roadtrip_vias SET after_order_index = ? WHERE id = ? AND day_id = ?').run(via.after_order_index, via.id, dayId);
  }
  renumberMergedLegs(db, dayId, vias.filter(via => !remove.includes(via.id)), moved);
  return { moved: moved.length, removed: remove.length };
}

/**
 * The leg a via pinned behind the n-th stop of the old order is on in the new one.
 *
 * A stop the write took off the day hands its road to the stop before it: the leg
 * it was drawn on merges into the one ahead, the way taking a stop out of the drive
 * merges them (`RoadtripService.reanchor`). Null when no leg is left for it, because
 * the stop it follows is the last one now, nothing ahead of it survived, or it was
 * pinned past the day's end to begin with. In a pure reorder every stop survives, so
 * nothing merges and each via lands on the leg of the very stop it was drawn after.
 */
function legAfter(index: number, previousIds: number[], nextIds: number[]): number | null {
  if (index > previousIds.length - 1) return null;
  let at = index;
  while (at >= 0 && !nextIds.includes(previousIds[at])) at -= 1;
  if (at < 0) return null;
  const next = nextIds.indexOf(previousIds[at]);
  return next >= nextIds.length - 1 ? null : next;
}

/**
 * Two legs that merged carry two sequence series side by side, and everything that
 * draws the route orders by sequence: the drive would run through the first leg's
 * point, the second leg's, and back. Renumbered the way `RoadtripService.reanchor`
 * does it, the earlier leg's points first, then by their old sequence, then by id.
 * Only a leg that received a via is touched.
 */
function renumberMergedLegs(db: SeatConnection, dayId: number, kept: PinnedVia[], moved: { id: number; after_order_index: number }[]): void {
  const landed = new Map(moved.map(via => [via.id, via.after_order_index]));
  const byLeg = new Map<number, PinnedVia[]>();
  for (const via of kept) {
    const leg = landed.get(via.id) ?? via.after_order_index;
    byLeg.set(leg, [...(byLeg.get(leg) ?? []), via]);
  }
  for (const onLeg of byLeg.values()) {
    if (!onLeg.some(via => landed.has(via.id))) continue;
    onLeg.sort((a, b) => a.after_order_index - b.after_order_index || a.sequence - b.sequence || a.id - b.id);
    onLeg.forEach((via, index) => {
      if (via.sequence !== index) db.prepare('UPDATE roadtrip_vias SET sequence = ? WHERE id = ? AND day_id = ?').run(index, via.id, dayId);
    });
  }
}
