/**
 * Turning an imported track into control points a tour can be planned through,
 * and measuring how far the line routed through them strays from the track.
 *
 * A recorded track is thousands of points, most of them noise of the walk, and
 * none of them says where the walker meant to go. The points kept here are the
 * ones the track's shape needs: a Douglas-Peucker pass keeps the bends, and a
 * longest-gap rule adds a point wherever the track runs on too long without
 * one, so the router is not left to guess across kilometres. Nothing here
 * claims the result is the same tour; the comparison says how close it is.
 */

export interface TrackPoint {
  lat: number;
  lng: number;
}

export interface ControlPointOptions {
  /** The most control points to keep, start and end included. */
  maxPoints?: number;
  /** The longest stretch of track, in metres, left without a control point. */
  maxGapM?: number;
  /** Control points closer than this, in metres, are merged (start and end stay). */
  minSpacingM?: number;
}

export interface RouteComparison {
  /** Length of the imported track, in kilometres. */
  originalKm: number;
  /** Length of the routed suggestion, in kilometres. */
  suggestionKm: number;
  /** The farthest any point of the track lies from the suggestion, in metres. */
  maxDeviationM: number;
  /** The share of the track within {@link CORRIDOR_M} of the suggestion, from 0 to 1. */
  withinCorridor: number;
}

/** How far from the suggestion a stretch of track still counts as followed, in metres. */
export const CORRIDOR_M = 50;
/** Below this share of the track in the corridor the suggestion is called a different route. */
export const FAITHFUL_SHARE = 0.85;

const EARTH_M = 6_371_000;
const RAD = Math.PI / 180;
/** The track's points compared against the suggestion, at most; a long track is sampled evenly. */
const COMPARE_SAMPLES = 600;

/** Points on a local plane in metres, good enough over the span of one tour. */
function projector(points: readonly TrackPoint[]) {
  const meanLat = points.reduce((sum, p) => sum + p.lat, 0) / Math.max(points.length, 1);
  const kx = Math.cos(meanLat * RAD) * EARTH_M * RAD;
  const ky = EARTH_M * RAD;
  return (p: TrackPoint): [number, number] => [p.lng * kx, p.lat * ky];
}

function distanceToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** The length of a line, in metres. */
export function lineLengthMeters(points: readonly TrackPoint[]): number {
  const project = projector(points);
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = project(points[i - 1]);
    const [bx, by] = project(points[i]);
    total += Math.hypot(bx - ax, by - ay);
  }
  return total;
}

/** Douglas-Peucker on projected points: the indices a line of the given tolerance keeps. */
function simplify(xy: readonly [number, number][], tolerance: number): number[] {
  const keep = new Uint8Array(xy.length);
  keep[0] = 1;
  keep[xy.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, xy.length - 1]];
  for (let range = stack.pop(); range; range = stack.pop()) {
    const [first, last] = range;
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = first + 1; i < last; i += 1) {
      const distance = distanceToSegment(xy[i], xy[first], xy[last]);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest !== -1) {
      keep[farthest] = 1;
      stack.push([first, farthest], [farthest, last]);
    }
  }
  return xy.flatMap((_, index) => (keep[index] ? [index] : []));
}

/** Adds a kept index wherever the track runs longer than `maxGapM` between two kept ones. */
function fillGaps(kept: number[], along: readonly number[], maxGapM: number): number[] {
  const result: number[] = [kept[0]];
  for (let k = 1; k < kept.length; k += 1) {
    const from = kept[k - 1];
    const to = kept[k];
    let last = from;
    for (let i = from + 1; i < to; i += 1) {
      if (along[i] - along[last] >= maxGapM && along[to] - along[i] >= maxGapM / 4) {
        result.push(i);
        last = i;
      }
    }
    result.push(to);
  }
  return result;
}

/** Drops kept indices closer than `minSpacingM` along the track to the one before; the end always stays. */
function spaceOut(kept: number[], along: readonly number[], minSpacingM: number): number[] {
  const result: number[] = [kept[0]];
  for (let k = 1; k < kept.length - 1; k += 1) {
    if (along[kept[k]] - along[result[result.length - 1]] >= minSpacingM) result.push(kept[k]);
  }
  const end = kept[kept.length - 1];
  if (result.length > 1 && along[end] - along[result[result.length - 1]] < minSpacingM) result.pop();
  result.push(end);
  return result;
}

/**
 * The control points a tour planned from this track would run through: start
 * and end, the bends the track's shape needs, and a point wherever it runs on
 * longer than `maxGapM` without one. A tolerance that keeps too many is widened
 * until the points fit `maxPoints`. A track with fewer than two points has none.
 */
export function deriveControlPoints(track: readonly TrackPoint[], options: ControlPointOptions = {}): TrackPoint[] {
  const { maxPoints = 25, maxGapM = 2_500, minSpacingM = 150 } = options;
  if (track.length < 2) return [];
  const project = projector(track);
  const xy = track.map(project);
  const along = [0];
  for (let i = 1; i < xy.length; i += 1)
    along.push(along[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  let tolerance = 25;
  let kept: number[] = [];
  for (let round = 0; round < 24; round += 1) {
    kept = spaceOut(fillGaps(simplify(xy, tolerance), along, maxGapM), along, minSpacingM);
    if (kept.length <= maxPoints) break;
    tolerance *= 1.4;
  }
  if (kept.length > maxPoints) {
    // Even a wide tolerance keeps too many (a very long track): evenly along it instead.
    const total = along[along.length - 1];
    kept = Array.from({ length: maxPoints }, (_, n) => {
      const target = (total * n) / (maxPoints - 1);
      return Math.max(
        0,
        along.findIndex((distance) => distance >= target)
      );
    });
  }
  return kept.map((index) => ({ lat: track[index].lat, lng: track[index].lng }));
}

/** How closely the suggestion follows the track: lengths, the farthest stray and the share inside the corridor. */
export function compareRoutes(track: readonly TrackPoint[], suggestion: readonly TrackPoint[]): RouteComparison {
  const project = projector([...track, ...suggestion]);
  const line = suggestion.map(project);
  const step = Math.max(1, Math.ceil(track.length / COMPARE_SAMPLES));
  const samples = track.filter((_, index) => index % step === 0 || index === track.length - 1).map(project);
  let maxDeviationM = 0;
  let within = 0;
  for (const point of samples) {
    let nearest = Infinity;
    for (let i = 1; i < line.length && nearest > 0; i += 1)
      nearest = Math.min(nearest, distanceToSegment(point, line[i - 1], line[i]));
    if (line.length === 1) nearest = Math.hypot(point[0] - line[0][0], point[1] - line[0][1]);
    maxDeviationM = Math.max(maxDeviationM, nearest);
    if (nearest <= CORRIDOR_M) within += 1;
  }
  return {
    originalKm: lineLengthMeters(track) / 1000,
    suggestionKm: lineLengthMeters(suggestion) / 1000,
    maxDeviationM,
    withinCorridor: samples.length ? within / samples.length : 0,
  };
}
