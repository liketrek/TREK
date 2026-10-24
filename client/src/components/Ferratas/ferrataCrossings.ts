import { ferrataTileAt, ferrataTileKey, type FerrataTile } from '@trek/shared';

import type { FerrataGroup } from './ferrataGroups';
import { ferrataPositions } from './ferrataModel';

/**
 * Where a tour's line runs along a via ferrata. The router walks a ferrata
 * like any trail once the difficulty cap allows alpine routes (T4 and up), so
 * a tour can climb one without anyone having picked it; this finds those
 * stretches on the line the planner shows, for the warning badge and the band
 * on the elevation profile.
 */
export interface FerrataCrossing {
  group: FerrataGroup;
  /** Where the stretch starts and ends, in metres along the route, as the elevation profile counts them. */
  fromM: number;
  toM: number;
}

/** How close a route point has to come to a ferrata to count as on it. */
const ON_FERRATA_M = 20;
/**
 * A shorter run is a trail crossing the ferrata or meeting it at an end, not a
 * climb along it. A ferrata shorter than that counts once most of it is walked.
 */
const MIN_STRETCH_M = 150;
const MIN_SHARE_OF_SHORT_FERRATA = 0.6;
/** Two stretches on the same ferrata this close together are one: a gap in the data, not a way off it. */
const JOIN_GAP_M = 30;
/** The most grid tiles a route asks for, about a thousand kilometres of line. */
const MAX_ROUTE_TILES = 200;

const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;

function distanceM([lat1, lng1]: readonly [number, number], [lat2, lng2]: readonly [number, number]): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** The distance from a point to a polyline, in metres, on a flat projection around the point (fine at these scales). */
function distanceToLineM(point: readonly [number, number], line: readonly [number, number][]): number {
  const metresPerLat = EARTH_RADIUS_M * RAD;
  const metresPerLng = metresPerLat * Math.cos(point[0] * RAD);
  const project = ([lat, lng]: readonly [number, number]) => [
    (lng - point[1]) * metresPerLng,
    (lat - point[0]) * metresPerLat,
  ];
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < line.length; i += 1) {
    const [ax, ay] = project(line[i - 1]);
    const [bx, by] = project(line[i]);
    const dx = bx - ax;
    const dy = by - ay;
    const span = dx * dx + dy * dy;
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / span));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  if (line.length === 1) {
    const [x, y] = project(line[0]);
    best = Math.hypot(x, y);
  }
  return best;
}

/** Whether a point lies inside a group's box widened by the reach. */
function nearBox(point: readonly [number, number], group: FerrataGroup): boolean {
  const padLat = ON_FERRATA_M / (EARTH_RADIUS_M * RAD);
  const padLng = padLat / Math.max(0.1, Math.cos(point[0] * RAD));
  const { south, north, west, east } = group.bbox;
  return (
    point[0] >= south - padLat && point[0] <= north + padLat && point[1] >= west - padLng && point[1] <= east + padLng
  );
}

/** The ferrata a route point is on, if any. */
function ferrataAt(
  point: readonly [number, number],
  groups: readonly FerrataGroup[],
  lines: ReadonlyMap<string, [number, number][][]>
): FerrataGroup | null {
  // The nearest one within reach: two ferratas often start a few metres apart at the same foot.
  let nearest: FerrataGroup | null = null;
  let nearestM = ON_FERRATA_M;
  for (const group of groups) {
    if (!nearBox(point, group)) continue;
    for (const line of lines.get(group.id) ?? []) {
      const gap = distanceToLineM(point, line);
      if (gap <= nearestM) {
        nearestM = gap;
        nearest = group;
      }
    }
  }
  return nearest;
}

/**
 * The stretches of the route that run along a ferrata, in route order. A
 * stretch is measured between the route points that lie on the ferrata, so a
 * trail that only crosses one or meets its foot stays out.
 */
export function routeFerrataCrossings(
  route: readonly (readonly [number, number])[] | null | undefined,
  groups: readonly FerrataGroup[]
): FerrataCrossing[] {
  if (!route || route.length < 2 || groups.length === 0) return [];
  const lines = new Map(groups.map((group) => [group.id, group.segments.map(ferrataPositions)]));
  const stretches: FerrataCrossing[] = [];
  let along = 0;
  let open: FerrataCrossing | null = null;
  for (let i = 0; i < route.length; i += 1) {
    if (i > 0) along += distanceM(route[i - 1], route[i]);
    const group = ferrataAt(route[i], groups, lines);
    if (open && group === open.group) {
      open.toM = along;
      continue;
    }
    if (open) stretches.push(open);
    open = group ? { group, fromM: along, toM: along } : null;
  }
  if (open) stretches.push(open);

  const joined: FerrataCrossing[] = [];
  for (const stretch of stretches) {
    const last = joined[joined.length - 1];
    if (last && last.group === stretch.group && stretch.fromM - last.toM <= JOIN_GAP_M) last.toM = stretch.toM;
    else joined.push({ ...stretch });
  }
  return joined.filter(
    (stretch) =>
      stretch.toM - stretch.fromM >= Math.min(MIN_STRETCH_M, stretch.group.lengthM * MIN_SHARE_OF_SHORT_FERRATA)
  );
}

/** The grid tiles the route runs through, so the ferratas along it can be loaded with the layer off; null past the cap. */
export function ferrataTilesAlong(
  route: readonly (readonly [number, number])[] | null | undefined
): FerrataTile[] | null {
  if (!route || route.length < 2) return [];
  const tiles = new Map<string, FerrataTile>();
  for (const [lat, lng] of route) {
    const tile = ferrataTileAt(lat, lng);
    tiles.set(ferrataTileKey(tile), tile);
    if (tiles.size > MAX_ROUTE_TILES) return null;
  }
  return [...tiles.values()];
}

/** The two ends of a ferrata that lie farthest apart, the start and the top of the climb in either order. */
export function ferrataEnds(group: FerrataGroup): [[number, number], [number, number]] | null {
  const ends = group.segments.flatMap((segment) => {
    const line = ferrataPositions(segment);
    const first = line[0];
    const last = line[line.length - 1];
    return first && last ? [first, last] : [];
  });
  let best: [[number, number], [number, number]] | null = null;
  let bestM = -1;
  for (let i = 0; i < ends.length; i += 1) {
    for (let j = i + 1; j < ends.length; j += 1) {
      const span = distanceM(ends[i], ends[j]);
      if (span > bestM) {
        bestM = span;
        best = [ends[i], ends[j]];
      }
    }
  }
  return best;
}

/** The widest gap two pieces of one ferrata may leave between them and still be walked as one line. */
const CHAIN_GAP_M = 80;

/**
 * The ferrata as one line from `from` (one of its ends) to its other end: its
 * OSM pieces, which arrive in any order and either direction, put end to end,
 * each turned the way the walk goes. Null when the pieces do not join up.
 */
export function ferrataLine(group: FerrataGroup, from: [number, number]): [number, number][] | null {
  const pieces = group.segments.map((segment) => ferrataPositions(segment)).filter((line) => line.length >= 2);
  if (pieces.length === 0) return null;
  const line: [number, number][] = [];
  let tail = from;
  while (pieces.length > 0) {
    let bestIndex = -1;
    let bestReversed = false;
    let bestGap = Number.POSITIVE_INFINITY;
    pieces.forEach((piece, index) => {
      const startGap = distanceM(tail, piece[0]);
      const endGap = distanceM(tail, piece[piece.length - 1]);
      if (startGap < bestGap) [bestIndex, bestReversed, bestGap] = [index, false, startGap];
      if (endGap < bestGap) [bestIndex, bestReversed, bestGap] = [index, true, endGap];
    });
    if (bestGap > CHAIN_GAP_M) return null;
    const [piece] = pieces.splice(bestIndex, 1);
    const oriented = bestReversed ? [...piece].reverse() : piece;
    line.push(...(line.length > 0 ? oriented.slice(1) : oriented));
    tail = oriented[oriented.length - 1];
  }
  return line;
}

/** How close a waypoint has to stand to a ferrata's end to count as at its foot or top. */
const AT_END_M = 40;

/**
 * The ferrata each waypoint stands at an end of, by waypoint id, among the
 * ferratas the route climbs: the ones "Add to tour" set, or any placed there.
 */
export function waypointsAtFerrataEnds<T>(
  waypoints: readonly { id: string; lat: number; lng: number }[],
  crossings: readonly FerrataCrossing[],
  describe: (group: FerrataGroup) => T
): Record<string, T> {
  const marks: Record<string, T> = {};
  const groups = [...new Map(crossings.map(({ group }) => [group.id, group])).values()];
  for (const point of waypoints) {
    const at = groups.find((group) =>
      group.segments.some((segment) => {
        const line = ferrataPositions(segment);
        const first = line[0];
        const last = line[line.length - 1];
        return [first, last].some((end) => !!end && distanceM([point.lat, point.lng], end) <= AT_END_M);
      })
    );
    if (at) marks[point.id] = describe(at);
  }
  return marks;
}

/**
 * For each stretch, the waypoint it follows on the route: each waypoint is
 * placed at the nearest point of the line after the waypoint before it
 * (`samples`, metres along it as the profile counts them), and a stretch
 * belongs to the leg its middle lies on. Null
 * before the first waypoint or without any.
 */
export function crossingLegs(
  waypoints: readonly { id: string; lat: number; lng: number }[],
  samples: readonly { distanceMeters: number; lat?: number; lng?: number }[],
  crossings: readonly Pick<FerrataCrossing, 'fromM' | 'toM'>[]
): Array<string | null> {
  // In order along the line: each waypoint is looked for from where the one
  // before it stands, so a route that passes a spot twice keeps its legs apart.
  let from = 0;
  const along = waypoints.map((point) => {
    let best = Number.POSITIVE_INFINITY;
    let at = from;
    for (const sample of samples) {
      if (sample.distanceMeters < from || sample.lat == null || sample.lng == null) continue;
      const gap = distanceM([point.lat, point.lng], [sample.lat, sample.lng]);
      if (gap < best) {
        best = gap;
        at = sample.distanceMeters;
      }
    }
    from = at;
    return { id: point.id, at };
  });
  return crossings.map((crossing) => {
    // By its middle: the trail to a ferrata's foot often runs beside it for a few metres first.
    const middle = (crossing.fromM + crossing.toM) / 2;
    let after: string | null = null;
    for (const point of along) if (point.at <= middle) after = point.id;
    return after;
  });
}
