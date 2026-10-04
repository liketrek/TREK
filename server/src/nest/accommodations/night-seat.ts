import { seamViaIndex } from '@trek/shared/roadtrip';

/**
 * Where a booked night sits in its day, and how the drawn roads follow when a stop
 * moves.
 *
 * One rule, applied by everything that seats a night: AccommodationsService when a
 * night is booked or edited, DaysService when a trip's dates move and carry the
 * night to another day row, and the migration that brought the trips planned under
 * the old rule along. The rule itself is pure (standsAhead, seatAmong, seatHolds and
 * the via plan). The services apply it through their repositories (the `*With`
 * functions, which take a structural store that DayAssignmentsRepository and
 * RoadtripViasRepository satisfy); the frozen migration helper
 * (db/reseat-booked-nights.ts) applies it with statements of its own, because it runs
 * synchronously over the raw handle inside the migration's transaction. Nothing here
 * injects anything, and nothing here spells SQL. Everything here runs inside the
 * caller's transaction.
 */

/**
 * A stop of one day as the rule sees it: the clock it is measured by, the booking that
 * owns it, and whether the router counts it (DayAssignmentsRepository.listSeatRows).
 *
 * `at` is the visit's own hour, else the place's. A stop a booking owns is measured by
 * that booking's check-in instead, and by nothing else. That is the value the night
 * seats itself by, so it has to be the value its peers see as well: read the same row
 * as an hour pinned on the stop and the two nights of a day would answer the question
 * differently depending on which of them is asking, and a pass that seats them both
 * would never settle.
 */
export interface SeatRow {
  id: number;
  order_index: number | null;
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
export interface PinnedVia {
  id: number;
  after_order_index: number;
  sequence: number;
}

/** A day stop being carried: its row, the day it stands on and where. */
export interface OwnStop {
  id: number;
  day_id: number;
  order_index: number | null;
}

/** What seating a night through the ORM needs from day_assignments
 *  (DayAssignmentsRepository satisfies it). */
export interface SeatStopStore {
  /** The day's {@link SeatRow}s, in day order. */
  listSeatRows(dayId: number): Promise<SeatRow[]>;
  closeGap(dayId: number, fromIndex: number): Promise<void>;
  maxOrderIndexExcluding(dayId: number, excludeId: number): Promise<number | null>;
  relocate(id: number, dayId: number, placeId: number, orderIndex: number): Promise<void>;
  shiftFromExcluding(dayId: number, fromIndex: number, excludeId: number): Promise<void>;
  setOrderIndex(id: number, dayId: number | undefined, orderIndex: number): Promise<void>;
}

/** What carrying the vias through the ORM needs from roadtrip_vias
 *  (RoadtripViasRepository satisfies it). */
export interface SeatViaStore {
  listAnchors(dayId: number): Promise<PinnedVia[]>;
  deleteInDay(id: number, dayId: number): Promise<void>;
  setAnchor(id: number, dayId: number, afterOrderIndex: number): Promise<void>;
  setSequence(id: number, dayId: number, sequence: number): Promise<void>;
}

/** What carrying a day's vias does to them (carryViasWith, and the migration helper). */
export interface ViaPlan {
  remove: number[];
  moved: { id: number; after_order_index: number }[];
  /** Vias of a merged leg whose sequence changes (renumberMergedLegs). */
  resequence: { id: number; sequence: number }[];
}

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------

/** The stops the router counts, in day order: the positions the vias are pinned to. */
export function locatedIds(rows: readonly SeatRow[]): number[] {
  return rows.filter(row => row.located).map(row => row.id);
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
 * The order_index a fresh insert of the night gets among a day's `rows`, with
 * everything from there on moved down (AssignmentsService.createAssignment).
 * `excludeId` leaves the night's own row out of the chain it is measured against:
 * without it a night parked at the end of the day can find itself.
 *
 * `Number(order_index) + 1`: a stored NULL order_index added to 1 gave 1 under the
 * legacy row type, and `Number(null)` keeps that coercion for the nullable column.
 */
export function seatIndexAmong(rows: readonly SeatRow[], night: Night, excludeId?: number): number {
  const others = rows.filter(row => row.id !== excludeId);
  const seat = seatAmong(others, night);
  return seat === 0 ? 0 : Number(others[seat - 1].order_index) + 1;
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
 * What keeping every drawn road behind the stop it was drawn after does to one
 * day's `vias`, now that a write has seated, moved or taken out a stop on it.
 * `previousIds` and `nextIds` are the located stops in order before and after: the
 * index space the vias are pinned to.
 *
 * The rules the planner applies when a stop is dragged or taken out: a via follows
 * its stop, a stop that left the day hands its road to the stop before it, and a
 * stop that is last has no leg to keep a via on. A via behind the day's last stop
 * bends the drive into the next day: it stays with that stop while it is still last,
 * whatever its number is now, and goes once another stop is last, because it lies on
 * the road to tomorrow and no leg of the day. That rule is the planner's own
 * (`seamViaIndex`), so the two cannot disagree about it.
 *
 * Null when nothing changes.
 */
export function planViaCarry(vias: readonly PinnedVia[], previousIds: number[], nextIds: number[]): ViaPlan | null {
  if (sameOrder(previousIds, nextIds) || !vias.length) return null;

  const remove: number[] = [];
  const moved: { id: number; after_order_index: number }[] = [];
  for (const via of vias) {
    const seam = seamViaIndex(via.after_order_index, previousIds, nextIds);
    const next = seam !== undefined ? seam : legAfter(via.after_order_index, previousIds, nextIds);
    if (next === null) remove.push(via.id);
    else if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  if (!remove.length && !moved.length) return null;
  return { remove, moved, resequence: renumberMergedLegs(vias.filter(via => !remove.includes(via.id)), moved) };
}

/** Whether a write left the day's located stops in the order they were in. */
export function sameOrder(previousIds: number[], nextIds: number[]): boolean {
  return previousIds.length === nextIds.length && previousIds.every((id, i) => id === nextIds[i]);
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
 * Only a leg that received a via is touched, and only a via whose sequence changes
 * is listed.
 */
function renumberMergedLegs(kept: PinnedVia[], moved: { id: number; after_order_index: number }[]): { id: number; sequence: number }[] {
  const landed = new Map(moved.map(via => [via.id, via.after_order_index]));
  const byLeg = new Map<number, PinnedVia[]>();
  for (const via of kept) {
    const leg = landed.get(via.id) ?? via.after_order_index;
    byLeg.set(leg, [...(byLeg.get(leg) ?? []), via]);
  }
  const resequence: { id: number; sequence: number }[] = [];
  for (const onLeg of byLeg.values()) {
    if (!onLeg.some(via => landed.has(via.id))) continue;
    onLeg.sort((a, b) => a.after_order_index - b.after_order_index || a.sequence - b.sequence || a.id - b.id);
    onLeg.forEach((via, index) => {
      if (via.sequence !== index) resequence.push({ id: via.id, sequence: index });
    });
  }
  return resequence;
}

// ---------------------------------------------------------------------------
// Through the ORM (the services)
// ---------------------------------------------------------------------------

export async function locatedStopIdsWith(stops: SeatStopStore, dayId: number): Promise<number[]> {
  return locatedIds(await stops.listSeatRows(dayId));
}

/** {@link seatIndexAmong} over the day as it stands now. */
export async function seatIndexWith(stops: SeatStopStore, dayId: number, night: Night, excludeId?: number): Promise<number> {
  return seatIndexAmong(await stops.listSeatRows(dayId), night, excludeId);
}

/**
 * Carry a night's own stop to `dayId` in place, seated where its check-in says.
 *
 * The gap it leaves on the day it came from is closed. Then it is parked at the end
 * of the target day and seated the way a fresh insert would be: two steps, because
 * the index it should get is read off a chain it is not part of yet.
 */
export async function reseatOwnStopWith(stops: SeatStopStore, stop: OwnStop, placeId: number, dayId: number, night: Night): Promise<void> {
  await stops.closeGap(stop.day_id, Number(stop.order_index));
  const max = await stops.maxOrderIndexExcluding(dayId, stop.id);
  const end = (max !== null ? max : -1) + 1;
  await stops.relocate(stop.id, dayId, placeId, end);

  const seat = await seatIndexWith(stops, dayId, night, stop.id);
  if (seat < end) {
    await stops.shiftFromExcluding(dayId, seat, stop.id);
    await stops.setOrderIndex(stop.id, undefined, seat);
  }
}

/** Carry one day's vias ({@link planViaCarry}). Returns what changed, or null when nothing did. */
export async function carryViasWith(vias: SeatViaStore, dayId: number, previousIds: number[], nextIds: number[]): Promise<{ moved: number; removed: number } | null> {
  if (sameOrder(previousIds, nextIds)) return null;
  const plan = planViaCarry(await vias.listAnchors(dayId), previousIds, nextIds);
  if (!plan) return null;
  for (const viaId of plan.remove) await vias.deleteInDay(viaId, dayId);
  for (const via of plan.moved) await vias.setAnchor(via.id, dayId, via.after_order_index);
  for (const via of plan.resequence) await vias.setSequence(via.id, dayId, via.sequence);
  return { moved: plan.moved.length, removed: plan.remove.length };
}
