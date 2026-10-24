/**
 * Turning a day's reordered timeline back into the writes that store it, shared by
 * the desktop day plan and the phone's plan timeline. Places get sequential
 * integer positions (0, 1, 2, ...); the notes and transports between place N-1 and
 * place N get fractional positions between the two.
 */

/** A timeline row as the reorder reads it: a place, a note or a transport (one leg of it, for a multi-leg booking). */
export interface MergedOrderItem {
  type: string;
  data: { id: number; __leg?: { index: number } | null };
}

export interface MergedOrderPlan {
  /** The day's assignments in their new order. */
  assignmentIds: number[];
  noteUpdates: { id: number; sort_order: number }[];
  transportUpdates: { id: number; day_plan_position: number }[];
  /**
   * Multi-leg flight legs share a reservation id, so their positions cannot live in
   * the single per-booking slot: reservation id, then leg index, then position.
   */
  legPosUpdates: Record<number, Record<number, number>>;
}

/**
 * The day order with the row at `from` taken out and put back in front of the first
 * row `isTarget` picks, or behind it with `after`; at the end when no row is picked.
 * `index` is where the row landed.
 */
export function moveRow<T>(
  order: readonly T[],
  from: number,
  isTarget: (row: T) => boolean,
  after = false
): { order: T[]; index: number } {
  const moved = [...order];
  const [row] = moved.splice(from, 1);
  const target = moved.findIndex(isTarget);
  const index = (target === -1 ? moved.length : target) + (after ? 1 : 0);
  moved.splice(index, 0, row);
  return { order: moved, index };
}

export function planMergedOrder(newOrder: readonly MergedOrderItem[]): MergedOrderPlan {
  const plan: MergedOrderPlan = { assignmentIds: [], noteUpdates: [], transportUpdates: [], legPosUpdates: {} };
  let placeCount = 0;
  let i = 0;
  while (i < newOrder.length) {
    if (newOrder[i].type === 'place') {
      plan.assignmentIds.push(newOrder[i].data.id);
      placeCount++;
      i++;
      continue;
    }
    // Consecutive non-place items share the gap after the place before them.
    const group: MergedOrderItem[] = [];
    while (i < newOrder.length && newOrder[i].type !== 'place') {
      group.push(newOrder[i]);
      i++;
    }
    const base = placeCount > 0 ? placeCount - 1 : -1;
    group.forEach((g, idx) => {
      const pos = base + (idx + 1) / (group.length + 1);
      if (g.type === 'note') plan.noteUpdates.push({ id: g.data.id, sort_order: pos });
      else if (g.type === 'transport') {
        if (g.data.__leg) (plan.legPosUpdates[g.data.id] ??= {})[g.data.__leg.index] = pos;
        else plan.transportUpdates.push({ id: g.data.id, day_plan_position: pos });
      }
    });
  }
  return plan;
}

interface PositionedBooking {
  id: number;
  day_plan_position?: number | null;
  day_positions?: Record<string, number> | null;
}

/** The bookings with the new positions written in, for the day they were moved on. */
export function withTransportPositions<R extends PositionedBooking>(
  reservations: R[],
  updates: MergedOrderPlan['transportUpdates'],
  dayId: number
): R[] {
  return reservations.map((r) => {
    const tu = updates.find((u) => u.id === r.id);
    if (!tu) return r;
    return {
      ...r,
      day_plan_position: tu.day_plan_position,
      day_positions: { ...(r.day_positions || {}), [dayId]: tu.day_plan_position },
    };
  });
}

/**
 * A booking as an edit or a collaborator's event hands it back, with the day slots of
 * the copy it replaces when it came without any. A server that did not send them yet
 * put a moved booking back by its time on every edit until the next reload (#2631).
 */
export function keepDayPositions<R extends PositionedBooking>(next: R, prev: R | undefined): R {
  if (!prev || next.day_positions !== undefined) return next;
  return { ...next, day_positions: prev.day_positions };
}

/**
 * A booking's metadata with each moved leg's position for the day written into
 * metadata.legs[i].day_positions. Null when the metadata holds no legs to move.
 * Metadata that cannot be parsed counts as empty.
 */
export function metadataWithLegPositions(
  metadata: unknown,
  positions: Record<number, number>,
  dayId: number
): Record<string, unknown> | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = typeof metadata === 'string' ? JSON.parse(metadata || '{}') : (metadata as Record<string, unknown>) || {};
  } catch {
    parsed = {};
  }
  if (!Array.isArray(parsed.legs)) return null;
  const legs = (parsed.legs as Record<string, unknown>[]).map((leg, li) => {
    const pos = positions[li];
    return pos == null
      ? leg
      : { ...leg, day_positions: { ...((leg.day_positions as Record<string, number>) || {}), [dayId]: pos } };
  });
  return { ...parsed, legs };
}
