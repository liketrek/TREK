import { TOUR_FIXED_LEG_MAX_POINTS, type PlannableTourType, type TourFixedLeg, type WalkFerryLeg } from '@trek/shared';
import { haversineKm } from '../../../utils/geo';
import type { WalkFerryCrossing } from '../planner/tourRouting';

interface LegPoint {
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
}

/** CW-12: only a city walk takes a crossing by boat; any other type gives the leg back to its router. */
export function walkOnly<T extends LegPoint>(points: readonly T[], tourType: PlannableTourType): T[] {
  if (tourType === 'walk') return [...points];
  return points.map((point) => {
    if (point.fixedLeg?.kind !== 'ferry') return point;
    const { fixedLeg: _crossing, ...routed } = point;
    return routed as T;
  });
}

/** Closer than this, in metres, a leg's end already is its point. */
const SAME_END_M = 1;

function off(point: LegPoint, end: readonly [number, number] | undefined): boolean {
  return !end || haversineKm(point, { lat: end[0], lng: end[1] }) * 1000 > SAME_END_M;
}

/**
 * CW-12: a crossing taken on purpose, as the ferry leg the walk keeps. The
 * router's line starts and ends where it bound the points, which may lie
 * further off than a fixed leg may; the points themselves are put at its ends,
 * so the leg always joins them. Null for a line longer than a leg may be.
 */
export function ferryLegOf(crossing: WalkFerryCrossing, from: LegPoint, to: LegPoint): TourFixedLeg | null {
  const head = off(from, crossing.geometry[0]);
  const tail = off(to, crossing.geometry[crossing.geometry.length - 1]);
  const geometry: [number, number][] = [
    ...(head ? [[from.lat, from.lng] as [number, number]] : []),
    ...crossing.geometry,
    ...(tail ? [[to.lat, to.lng] as [number, number]] : []),
  ];
  if (geometry.length > TOUR_FIXED_LEG_MAX_POINTS) return null;
  const shift = head ? 1 : 0;
  return {
    kind: 'ferry',
    geometry,
    crossings: crossing.crossings.map(([from, to]): [number, number] => [from + shift, to + shift]),
    minutes: ferryMinutesOf(crossing),
    walk_minutes: Math.round(crossing.walkSeconds / 60),
  };
}

/** The stretch of the leg from where its first boat leaves to where its last lands, for the map to show it. */
export function crossingLine(crossing: WalkFerryCrossing): [number, number][] {
  const first = crossing.crossings[0];
  const last = crossing.crossings[crossing.crossings.length - 1];
  return first && last ? crossing.geometry.slice(first[0], last[1] + 1) : crossing.geometry;
}

/** The minutes a crossing takes by boat, null where the router gave none. */
export function ferryMinutesOf(crossing: Pick<WalkFerryCrossing, 'seconds'>): number | null {
  return crossing.seconds === null ? null : Math.max(1, Math.round(crossing.seconds / 60));
}

/** The planner's crossings as the ferry legs a walk's times read: the boat parts of each leg and their minutes. */
export function ferryLegsOfCrossings(crossings: readonly WalkFerryCrossing[]): WalkFerryLeg[] {
  return crossings.map((crossing) => ({
    crossings: crossing.crossings.map(([from, to]) => crossing.geometry.slice(from, to + 1)),
    minutes: ferryMinutesOf(crossing),
  }));
}

/**
 * The stations a leg runs between as the stop list shows them: a leg from or
 * to a shaping point is named by the station before it and the one after it.
 */
export function legStationsOf<T extends { shaping?: boolean }>(
  points: readonly T[],
  leg: number
): { from: T | null; to: T | null } {
  let from = leg;
  while (from > 0 && points[from]?.shaping) from -= 1;
  let to = leg + 1;
  while (to < points.length - 1 && points[to]?.shaping) to += 1;
  return { from: points[from] ?? null, to: points[to] ?? null };
}

/** The minutes a walk's crossings take by boat: their sum, null while one has no time, undefined without any. */
export function crossingsMinutesOf(
  crossings: readonly Pick<WalkFerryCrossing, 'seconds'>[]
): number | null | undefined {
  if (crossings.length === 0) return undefined;
  const minutes = crossings.map(ferryMinutesOf);
  return minutes.every((value) => value !== null)
    ? minutes.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
}
