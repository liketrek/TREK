import type { AssistantActivityArea, AssistantApplied, AssistantChangeEffect, AssistantMessage } from '@trek/shared';
import type { Assignment, AssignmentsMap } from '../types';

/**
 * What the map makes of the assistant's chat: the suggestions still waiting to
 * be decided, the area a running step searches, and the days a block of
 * changes touched. Pure and React-free, so the store and the planner's map
 * hook read the same answers and the tests need neither.
 */

/** [lat, lng], the order both map renderers take. */
export type LatLng = [number, number];

/** Stops by day: the trip store's map, or a snapshot of some of its days. */
interface DayPlans {
  readonly [dayId: number]: readonly Assignment[] | undefined;
}

/** One block of changes is named by its first call, the same key the change card builds from its items. */
export function blockKeyOf(toolCallIds: readonly string[]): string {
  return toolCallIds[0] ?? '';
}

/** The effect each change of the thread has on the day plan, by its call. */
export function changeEffects(messages: readonly AssistantMessage[]): Map<string, AssistantChangeEffect> {
  const effects = new Map<string, AssistantChangeEffect>();
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === 'data-trek-change' && p.data.effect) effects.set(p.data.toolCallId, p.data.effect);
    }
  }
  return effects;
}

/** The receipt of every applied change of the thread, by its call. */
export function receiptsOf(messages: readonly AssistantMessage[]): Map<string, AssistantApplied> {
  const receipts = new Map<string, AssistantApplied>();
  for (const m of messages) {
    for (const p of m.parts) if (p.type === 'data-trek-applied') receipts.set(p.data.toolCallId, p.data);
  }
  return receipts;
}

/**
 * A change the map may draw before it exists: its call, what it does to the
 * plan, and how far it got. `waiting` is undecided, `running` applied but not
 * answered yet, `applied` done, with the place it made when it made one.
 */
export interface GhostCandidate {
  toolCallId: string;
  effect: AssistantChangeEffect;
  status: 'waiting' | 'running' | 'applied';
  placeId: number | null;
}

/**
 * Every change of the thread that could stand on the map as a ghost, in the
 * order of the chat. Discarded, expired and failed changes are not, and
 * neither is a removal: what goes is already on the map.
 */
export function ghostCandidates(messages: readonly AssistantMessage[]): GhostCandidate[] {
  const effects = changeEffects(messages);
  if (effects.size === 0) return [];
  const receipts = receiptsOf(messages);
  const candidates: GhostCandidate[] = [];
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type !== 'tool-call' || !p.approval || p.approval.resolution) continue;
      const effect = effects.get(p.toolCallId);
      if (!effect || effect.kind === 'remove' || p.approval.approved === false) continue;
      const receipt = receipts.get(p.toolCallId);
      if (p.approval.approved === undefined) {
        candidates.push({ toolCallId: p.toolCallId, effect, status: 'waiting', placeId: null });
      } else if (receipt) {
        candidates.push({ toolCallId: p.toolCallId, effect, status: 'applied', placeId: receipt.ids[0] ?? null });
      } else if (p.result === undefined) {
        candidates.push({ toolCallId: p.toolCallId, effect, status: 'running', placeId: null });
      }
    }
  }
  return candidates;
}

/**
 * The candidates the map draws as ghosts now. One waiting for a decision
 * always is. A new place the user applied stays one until the trip holds the
 * place it made (its id comes with the receipt, the place itself with the
 * broadcast), so the pin never blinks out between the two. An applied change
 * to a place that already existed is that place's own pin from then on.
 */
export function liveGhosts(
  candidates: readonly GhostCandidate[],
  knownPlaceIds: ReadonlySet<number>
): GhostCandidate[] {
  return candidates.filter((c) => {
    if (c.status === 'waiting') return true;
    if (!c.effect.place) return false;
    return c.status === 'running' || (c.placeId !== null && !knownPlaceIds.has(c.placeId));
  });
}

const METERS_PER_DEGREE = 111_320;

/** The corners of the area a running step searches, or nothing when it names none. */
export function activityFocus(area: AssistantActivityArea | null): LatLng[] {
  if (!area) return [];
  if (area.type === 'bbox') {
    return [
      [area.south, area.west],
      [area.north, area.east],
    ];
  }
  const dLat = area.radiusM / METERS_PER_DEGREE;
  // Near a pole a degree of longitude shrinks to nothing; the floor keeps the box finite.
  const dLng = area.radiusM / (METERS_PER_DEGREE * Math.max(Math.cos((area.lat * Math.PI) / 180), 0.01));
  return [
    [area.lat - dLat, area.lng - dLng],
    [area.lat + dLat, area.lng + dLng],
  ];
}

/** The days a set of changes touches: where each lands and where a move comes from. */
export function blockDays(effects: readonly AssistantChangeEffect[]): number[] {
  const days = new Set<number>();
  for (const e of effects) {
    days.add(e.dayId);
    if (e.fromDayId !== null) days.add(e.fromDayId);
  }
  return [...days];
}

/** The positions of the stops on the given days. */
export function dayPoints(assignments: DayPlans, dayIds: readonly number[]): LatLng[] {
  const points: LatLng[] = [];
  for (const dayId of dayIds) {
    for (const visit of assignments[dayId] ?? []) {
      const lat = visit.place?.lat;
      const lng = visit.place?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') points.push([lat, lng]);
    }
  }
  return points;
}

/** The plan of the given days as it stands, for "before" once the changes ran. */
export function snapshotDays(assignments: DayPlans, dayIds: readonly number[]): Record<number, Assignment[]> {
  const snapshot: Record<number, Assignment[]> = {};
  for (const dayId of dayIds) snapshot[dayId] = [...(assignments[dayId] ?? [])];
  return snapshot;
}

/**
 * The plan the map shows while "before" is on: the snapshot's days laid over
 * the planner's view of the rest.
 *
 * The snapshot is taken from the store, the view hides some stops (hotel
 * stops, service stops the traveller switched off). A stop still stored on its
 * day but missing from the view is one of those and stays hidden; a stop no
 * longer stored there is one the block took away and shows again.
 */
export function overlaySnapshot(
  view: AssignmentsMap,
  stored: AssignmentsMap,
  snapshot: Readonly<Record<number, Assignment[]>>
): AssignmentsMap {
  const next: AssignmentsMap = { ...view };
  for (const [day, visits] of Object.entries(snapshot)) {
    const storedIds = new Set((stored[day] ?? []).map((v) => v.id));
    const shownIds = new Set((view[day] ?? []).map((v) => v.id));
    next[day] = visits.filter((v) => !storedIds.has(v.id) || shownIds.has(v.id));
  }
  return next;
}

/** Where the floating window sits, as the store keeps it: `x` counts from the inline start. */
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The screen edge something covers the map from, and how far in it reaches, in CSS pixels. */
interface MapCover {
  side: 'left' | 'right';
  px: number;
}

/** Room left between the window and what the map frames beside it. */
const WINDOW_GAP = 24;

/**
 * How far the floating window reaches over the map from the screen edge it is
 * nearer to, so a fit lands in the part still visible. Screen geometry, so the
 * window's inline-start offset is turned into a distance from the physical
 * edge first. A window that takes most of the width leaves nothing worth
 * framing beside it and covers nothing here.
 */
export function windowCover(rect: WindowRect | null, viewportWidth: number, rtl: boolean): MapCover | null {
  if (!rect || viewportWidth <= 0 || rect.width > viewportWidth * 0.6) return null;
  const fromScreenStart = rtl ? viewportWidth - rect.x - rect.width : rect.x;
  if (fromScreenStart + rect.width / 2 > viewportWidth / 2) {
    return { side: 'right', px: Math.max(0, viewportWidth - fromScreenStart + WINDOW_GAP) };
  }
  return { side: 'left', px: Math.max(0, fromScreenStart + rect.width + WINDOW_GAP) };
}
