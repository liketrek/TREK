import { TOUR_FIXED_LEG_END_TOLERANCE_M, tourFixedLegSchema, type TourFixedLeg } from '@trek/shared';
import { haversineKm } from '../../../utils/geo';

/**
 * Legs the router does not plan: a via ferrata put onto the tour, whose own
 * line from OpenStreetMap the tour follows from one waypoint to the next. A
 * fixed leg only holds while it still joins its two waypoints, so moving,
 * removing or reordering either of them turns the leg back into a routed one.
 */
export interface FixedLegPoint {
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
}

/** Read as a plain array: this workspace compiles without strict mode, where the schema's tuples are "maybe two numbers". */
function gapM(a: { lat: number; lng: number }, end: readonly unknown[]): number {
  return haversineKm(a, { lat: Number(end[0]), lng: Number(end[1]) }) * 1000;
}

/** Whether a leg still runs from this waypoint to the next one. */
function fixedLegJoins(point: FixedLegPoint, next: FixedLegPoint | undefined, leg: TourFixedLeg): boolean {
  const first = leg.geometry[0];
  const last = leg.geometry[leg.geometry.length - 1];
  return (
    !!next &&
    !!first &&
    !!last &&
    gapM(point, first) <= TOUR_FIXED_LEG_END_TOLERANCE_M &&
    gapM(next, last) <= TOUR_FIXED_LEG_END_TOLERANCE_M
  );
}

/** The points with every leg that no longer joins its waypoints (or does not parse) dropped. */
export function keepJoinedFixedLegs<T extends FixedLegPoint>(points: readonly T[]): T[] {
  return points.map((point, index) => {
    if (!point.fixedLeg) return point;
    const parsed = tourFixedLegSchema.safeParse(point.fixedLeg);
    if (parsed.success && fixedLegJoins(point, points[index + 1], parsed.data)) return point;
    const { fixedLeg: _dropped, ...rest } = point;
    return rest as T;
  });
}

/** The length of a line, in metres. */
export function lineLengthM(line: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    total += haversineKm({ lat: line[i - 1][0], lng: line[i - 1][1] }, { lat: line[i][0], lng: line[i][1] }) * 1000;
  }
  return total;
}

/** The longest stretch, in metres, a hand-drawn leg runs without a point of its own. */
const FREE_LEG_SAMPLE_M = 25;

/**
 * A straight line with a point every `stepM` metres, so the heights read for
 * it follow the ground under the whole stretch and not only its two ends. The
 * line itself does not change; a short one comes back as it was.
 */
export function densifyLine(line: readonly [number, number][], stepM = FREE_LEG_SAMPLE_M): [number, number][] {
  const dense: [number, number][] = [];
  line.forEach((point, index) => {
    const next = line[index + 1];
    dense.push(point);
    if (!next) return;
    const parts = Math.floor(lineLengthM([point, next]) / stepM);
    for (let i = 1; i < parts; i += 1) {
      dense.push([point[0] + ((next[0] - point[0]) * i) / parts, point[1] + ((next[1] - point[1]) * i) / parts]);
    }
  });
  return dense;
}
