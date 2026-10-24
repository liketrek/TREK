import type { AssistantChangeEffect } from '@trek/shared';

import { dayPoints, type LatLng } from '../../store/assistantMapModel';
import type { Assignment, AssignmentsMap, Place } from '../../types';
import { haversineKm } from '../../utils/geo';

/**
 * A day as it would read once the waiting changes of a card ran: the stops it
 * keeps, the ones that join it and the ones that leave it, each with the way
 * from the stop before. Pure and React-free, so the change card draws it and a
 * test can pin it.
 *
 * Only what the assistant can do shows up here. It cannot set a time or a
 * position, so a stop that joins the day lands at its end, the way the server
 * appends it. The way between two stops is a straight line bent by a detour
 * factor and read at the leg's speed: a quick estimate, which the card marks
 * with "≈", and no router request per suggestion.
 */

/** One waiting change, as much of it as the day plan needs. */
export interface DayChange {
  toolCallId: string;
  effect: AssistantChangeEffect;
  /** What the card calls it, for a stop the trip does not hold yet. */
  subject: string | null;
}

type StopStatus = 'kept' | 'new' | 'removed';

/** How a stop follows the one before it on the day. */
interface StopLead {
  /** Estimated minutes on the way there; null without both positions. */
  travelMinutes: number | null;
  /** Minutes left free between the two, the way there taken off; null when the times do not say. */
  freeMinutes: number | null;
  /** The stop before, when the two take the same time. */
  overlapsWith: string | null;
  /** Minutes the way there is longer than the time between the two; null when it fits or the times do not say. */
  shortBy: number | null;
}

export interface TimelineStop {
  key: string;
  name: string;
  status: StopStatus;
  /** The change that adds or removes it; null for a stop the card leaves alone. */
  toolCallId: string | null;
  /** The planned start as written, "09:30"; null when none is set. */
  time: string | null;
  /** Null for the first stop of the day and for one that leaves it. */
  lead: StopLead | null;
}

export interface DayAfter {
  dayId: number;
  stops: TimelineStop[];
}

/** Free time below this is not worth a line. */
const GAP_MIN_MINUTES = 30;
/** Roads and paths are longer than the straight line. */
const DETOUR_FACTOR = 1.3;

/** km/h on a leg, by its travel mode. */
function speedOf(mode: string): number {
  if (mode === 'walking') return 4.5;
  if (mode === 'cycling' || mode === 'bicycle' || mode === 'bike') return 15;
  return 50;
}

/** Minutes since midnight of an "HH:MM" value; null for anything else. */
export function minutesOf(value: string | null | undefined): number | null {
  const match = value ? /^(\d{1,2}):(\d{2})/.exec(value) : null;
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

interface Draft {
  stop: Omit<TimelineStop, 'lead'>;
  lat: number | null;
  lng: number | null;
  start: number | null;
  end: number | null;
  legMode: string | null;
}

function draftOf(visit: Assignment, status: StopStatus, toolCallId: string | null, key: string): Draft {
  const place = visit.place;
  const time = visit.assignment_time ?? place?.place_time ?? null;
  const start = minutesOf(time);
  const explicitEnd = minutesOf(visit.assignment_end_time ?? place?.end_time ?? null);
  const duration = place?.duration_minutes;
  const end = explicitEnd ?? (start !== null && typeof duration === 'number' && duration > 0 ? start + duration : null);
  return {
    stop: { key, name: place?.name ?? '', status, toolCallId, time: start === null ? null : time },
    lat: typeof place?.lat === 'number' ? place.lat : null,
    lng: typeof place?.lng === 'number' ? place.lng : null,
    start,
    end,
    legMode: visit.leg_transport_mode ?? null,
  };
}

function findVisit(assignments: AssignmentsMap, dayId: number | null, assignmentId: number | null) {
  if (dayId === null || assignmentId === null) return undefined;
  return (assignments[dayId] ?? []).find((v) => v.id === assignmentId);
}

/** A stop the change brings onto the day; null when there is nothing to name it by. */
function joiningDraft(
  change: DayChange,
  assignments: AssignmentsMap,
  places: ReadonlyMap<number, Place>
): Draft | null {
  const { effect, toolCallId } = change;
  const key = `new:${toolCallId}`;
  const moved = effect.kind === 'move' ? findVisit(assignments, effect.fromDayId, effect.assignmentId) : undefined;
  if (moved) return draftOf(moved, 'new', toolCallId, key);
  const place = effect.placeId === null ? undefined : places.get(effect.placeId);
  const name = effect.place?.name ?? place?.name ?? change.subject;
  if (!name) return null;
  const lat = effect.place?.lat ?? place?.lat ?? null;
  const lng = effect.place?.lng ?? place?.lng ?? null;
  return {
    stop: { key, name, status: 'new', toolCallId, time: null },
    lat,
    lng,
    start: null,
    end: null,
    legMode: null,
  };
}

/** The visits of the day that a change takes off it, by assignment, with the change that does. */
function leavingVisits(dayId: number, changes: readonly DayChange[]): Map<number, string> {
  const leaving = new Map<number, string>();
  for (const { effect, toolCallId } of changes) {
    if (effect.assignmentId === null) continue;
    const removes = effect.kind === 'remove' && effect.dayId === dayId;
    const movesAway = effect.kind === 'move' && effect.fromDayId === dayId && effect.dayId !== dayId;
    if (removes || movesAway) leaving.set(effect.assignmentId, toolCallId);
  }
  return leaving;
}

function leadOf(prev: Draft, cur: Draft, defaultMode: string): StopLead {
  const travelMinutes =
    prev.lat !== null && prev.lng !== null && cur.lat !== null && cur.lng !== null
      ? Math.round(
          ((haversineKm({ lat: prev.lat, lng: prev.lng }, { lat: cur.lat, lng: cur.lng }) * DETOUR_FACTOR) /
            speedOf(prev.legMode ?? defaultMode)) *
            60
        )
      : null;
  const none = { freeMinutes: null, overlapsWith: null, shortBy: null };
  if (cur.start === null || prev.end === null) return { travelMinutes, ...none };
  if (cur.start < prev.end) return { travelMinutes, ...none, overlapsWith: prev.stop.name };
  const free = cur.start - prev.end - (travelMinutes ?? 0);
  if (free < 0) return { travelMinutes, ...none, shortBy: -free };
  return { travelMinutes, ...none, freeMinutes: free >= GAP_MIN_MINUTES ? free : null };
}

/**
 * The day after the changes: its own stops in their order (hotel stops left
 * out, as the day plan hides them), the ones a change takes away marked, the
 * ones that join it at the end.
 */
export function buildDayAfter(input: {
  dayId: number;
  assignments: AssignmentsMap;
  places: readonly Place[];
  changes: readonly DayChange[];
  defaultMode: string | null | undefined;
}): DayAfter {
  const { dayId, assignments, changes } = input;
  const places = new Map(input.places.map((p) => [p.id, p]));
  const leaving = leavingVisits(dayId, changes);
  const own = [...(assignments[dayId] ?? [])]
    .filter((v) => !v.accommodation_id)
    .sort((a, b) => a.order_index - b.order_index);
  const drafts = own.map((v) => {
    const by = leaving.get(v.id) ?? null;
    return draftOf(v, by ? 'removed' : 'kept', by, `a:${v.id}`);
  });
  for (const change of changes) {
    const { effect } = change;
    if (effect.dayId !== dayId || effect.kind === 'remove' || effect.fromDayId === dayId) continue;
    const draft = joiningDraft(change, assignments, places);
    if (draft) drafts.push(draft);
  }
  const defaultMode = input.defaultMode ?? 'walking';
  let prev: Draft | null = null;
  const stops = drafts.map((d) => {
    if (d.stop.status === 'removed') return { ...d.stop, lead: null };
    const lead = prev ? leadOf(prev, d, defaultMode) : null;
    prev = d;
    return { ...d.stop, lead };
  });
  return { dayId, stops };
}

/**
 * Where the map should look to show a card's changes: each change's own place
 * (a new one by its coordinates, a planned one by the trip's) and the stops of
 * the days they touch, so the suggestion shows beside the rest of its day.
 */
export function changePoints(
  changes: readonly DayChange[],
  assignments: AssignmentsMap,
  places: readonly Place[]
): LatLng[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  const points: LatLng[] = [];
  for (const { effect } of changes) {
    const place = effect.placeId === null ? undefined : byId.get(effect.placeId);
    const lat = effect.place?.lat ?? place?.lat;
    const lng = effect.place?.lng ?? place?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') points.push([lat, lng]);
  }
  return [...points, ...dayPoints(assignments, changedDays(changes))];
}

/** The days a card's changes touch, in the order they come: where each lands, then where a move leaves. */
export function changedDays(changes: readonly DayChange[]): number[] {
  const days: number[] = [];
  const add = (id: number | null) => {
    if (id !== null && !days.includes(id)) days.push(id);
  };
  for (const { effect } of changes) {
    add(effect.dayId);
    add(effect.fromDayId);
  }
  return days;
}
