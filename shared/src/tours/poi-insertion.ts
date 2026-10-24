import { haversineMetres } from '../geo/haversine';
import { nearnessToLine } from './route-corridor';
import { isClosedLoop } from './tour-walk';
import type { TourFixedLeg } from './tours.schema';

/**
 * PLN-03 and PLN-04: where a place found along a tour can go in as a stop,
 * the same answer for the planner in the browser and for the assistant's
 * insert_tour_stop on the server. Plain list operations on the ordered points
 * of a tour; neither side's own point type is needed, only its id, spot,
 * role and the fixed line its leg to the next point keeps.
 */
export interface InsertionPoint {
  id: string;
  lat: number;
  lng: number;
  role: string;
  fixedLeg?: TourFixedLeg | null;
  shaping?: boolean;
}

/**
 * Why a place cannot go in after a point (PLN-03): the leg after it is a
 * fixed line (a via ferrata, a portage) or drawn by hand, which a new point in
 * between would cut or redraw without being asked; or there is no leg after it
 * to go into (the way back of a loop, a point that is gone).
 */
export type InsertionBlock = 'fixed' | 'free' | 'none';

/**
 * The points with a new end: after the last point, or for a loop between its
 * last stop and the way back to the start, so the tour still comes back.
 */
export function withPointAppended<T extends { lat: number; lng: number; role: string }>(
  points: readonly T[],
  point: T,
): T[] {
  if (!isClosedLoop(points)) return [...points, { ...point, role: 'end' }];
  const end = points[points.length - 1];
  return end ? [...points.slice(0, -1), { ...point, role: 'via' }, end] : [{ ...point, role: 'end' }];
}

/** What would stop a place going in after `afterId`, or null when it can. */
export function insertionBlock(points: readonly InsertionPoint[], afterId: string): InsertionBlock | null {
  const index = points.findIndex((point) => point.id === afterId);
  if (index < 0) return 'none';
  const last = index === points.length - 1;
  // After the last point the tour goes on to the place; after the way back of a loop there is nothing.
  if (last) return isClosedLoop(points) ? 'none' : null;
  const leg = points[index]?.fixedLeg;
  if (leg?.kind === 'free') return 'free';
  if (leg) return 'fixed';
  return null;
}

/**
 * The points with a new stop right after `afterId`: in a leg the router plans,
 * between that point and the next, or as the new end after the last. Null
 * where {@link insertionBlock} says it cannot go; nothing else is changed.
 */
export function withPointAfter<T extends InsertionPoint>(points: readonly T[], afterId: string, point: T): T[] | null {
  if (insertionBlock(points, afterId) !== null) return null;
  const index = points.findIndex((candidate) => candidate.id === afterId);
  if (index === points.length - 1) return withPointAppended(points, point);
  return [...points.slice(0, index + 1), { ...point, role: 'via' }, ...points.slice(index + 1)];
}

/**
 * The point a place found at `alongM` metres along the route most likely
 * follows: the last point before it along the line, where a stop can go in.
 * The first point that can take one when none lies before it. A shaping point
 * only steers the line, so a stop never goes in after one.
 */
export function defaultAfterId(
  points: readonly InsertionPoint[],
  route: ReadonlyArray<readonly [number, number, ...number[]]> | null,
  alongM: number,
): string | null {
  const open = points.filter((point) => point.shaping !== true && insertionBlock(points, point.id) === null);
  if (!open.length) return null;
  const line = route && route.length > 1 ? route : points.map((point): [number, number] => [point.lat, point.lng]);
  let chosen = open[0]?.id ?? null;
  for (const point of open) {
    const along = nearnessToLine(point, line)?.alongM ?? 0;
    if (along <= alongM) chosen = point.id;
  }
  return chosen;
}

/** How far along the route a place lies, in metres, read from the line or the points joined straight. */
export function alongRouteM(
  points: readonly InsertionPoint[],
  route: ReadonlyArray<readonly [number, number, ...number[]]> | null,
  place: { lat: number; lng: number },
): number {
  const line = route && route.length > 1 ? route : points.map((point): [number, number] => [point.lat, point.lng]);
  return nearnessToLine(place, line)?.alongM ?? 0;
}

/**
 * The point a place goes in after: the one picked for it while that point is
 * still there (not undone, not removed), else the suggestion.
 */
export function chosenAfterId(
  points: readonly InsertionPoint[],
  route: ReadonlyArray<readonly [number, number, ...number[]]> | null,
  place: { id: string; along_m: number },
  picked: { poiId: string; afterId: string } | null,
): string | null {
  if (picked?.poiId === place.id && points.some((point) => point.id === picked.afterId)) return picked.afterId;
  return defaultAfterId(points, route, place.along_m);
}

/**
 * PLN-04: where a place can go, one slot per point: between it and the next
 * point, or after the last as the new end, which makes the tour longer. A
 * slot that cannot take it says why, so the list can show it dimmed.
 */
export interface InsertionSlot {
  afterId: string;
  /** The point it would go in before; null where it would become the new end. */
  beforeId: string | null;
  block: InsertionBlock | null;
}

export function insertionSlots(points: readonly InsertionPoint[]): InsertionSlot[] {
  return points.map((point, index) => ({
    afterId: point.id,
    beforeId: points[index + 1]?.id ?? null,
    block: insertionBlock(points, point.id),
  }));
}

/**
 * The straight lines a place would add in the slot after `afterId`: from that
 * point to the place and on to the next, or only to the place as the new
 * end. Null where it cannot go there.
 */
export function insertionPreview(
  points: readonly InsertionPoint[],
  afterId: string,
  place: { lat: number; lng: number },
): Array<[number, number]> | null {
  if (insertionBlock(points, afterId) !== null) return null;
  const index = points.findIndex((point) => point.id === afterId);
  const from = points[index];
  if (!from) return null;
  const to = points[index + 1];
  const line: Array<[number, number]> = [
    [from.lat, from.lng],
    [place.lat, place.lng],
  ];
  return to ? [...line, [to.lat, to.lng]] : line;
}

/** How much longer the preview's lines make the tour, as the crow flies; the route planned after says it exactly. */
export function straightDetourM(line: ReadonlyArray<readonly [number, number]>): number {
  const legs = (path: ReadonlyArray<readonly [number, number]>) =>
    path.slice(1).reduce((sum, [lat, lng], index) => {
      const [fromLat, fromLng] = path[index] ?? [lat, lng];
      return sum + haversineMetres(fromLat, fromLng, lat, lng);
    }, 0);
  const first = line[0];
  const last = line[line.length - 1];
  const replaced = line.length > 2 && first && last ? legs([first, last]) : 0;
  return Math.max(0, legs(line) - replaced);
}

/** The places of a search that are a point of the tour already, told by where they lie: a taken place keeps its spot. */
export function placesInTour(
  places: ReadonlyArray<{ id: string; lat: number; lng: number }>,
  points: ReadonlyArray<{ lat: number; lng: number }>,
): Set<string> {
  const spots = new Set(points.map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`));
  return new Set(
    places.filter((place) => spots.has(`${place.lat.toFixed(6)},${place.lng.toFixed(6)}`)).map((place) => place.id),
  );
}
