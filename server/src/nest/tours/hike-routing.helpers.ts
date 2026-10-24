import type { TracedWay } from '../roadtrip/roadtrip-router.service';
import { thinnedLine } from './tours.helpers';
import {
  haversineMetres,
  type GeometryPoint,
  type HikeSacSegment,
  type HikeTrailGrades,
  type SacStep,
} from '@trek/shared';

/**
 * The pure halves of a hike planned on the server (HikeRoutingService): the
 * routed line as one line, its height profile for display, and the SAC
 * grades of the ways under it laid onto the line as stretches. The measures
 * along a line and the joining of stretches are here once, for the proposal
 * (hike-plan.helpers) as well.
 */

type HeightPoint = [number, number, number];

function hasHeight(point: GeometryPoint): point is HeightPoint {
  return point.length === 3;
}

/**
 * The router's line with every point that repeats the one before it left
 * out: each leg starts on the point the one before ended at, and the planner
 * in the browser joins its legs the same way. A line that would be left with
 * a single point stays as it was.
 */
export function joinedLine(line: ReadonlyArray<readonly [number, number]>): Array<[number, number]> {
  const kept: Array<[number, number]> = [];
  for (const [lat, lng] of line) {
    const last = kept[kept.length - 1];
    if (!last || last[0] !== lat || last[1] !== lng) kept.push([lat, lng]);
  }
  return kept.length >= 2 ? kept : line.map(([lat, lng]): [number, number] => [lat, lng]);
}

/** The line with its heights where every point has one, else as it was without any. */
export function heightsOrNone(
  flat: ReadonlyArray<[number, number]>,
  measured: readonly GeometryPoint[] | null,
): GeometryPoint[] {
  return measured && measured.length === flat.length && measured.every(hasHeight) ? [...measured] : [...flat];
}

/** Metres along the line at each of its points, the first at 0. */
export function metresAlong(line: readonly GeometryPoint[]): number[] {
  let along = 0;
  return line.map(([lat, lng], index) => {
    const before = line[index - 1];
    if (before) along += haversineMetres(before[0], before[1], lat, lng);
    return along;
  });
}

/**
 * The height profile for display: `[metres along the line, height]` at most
 * `most` times, spread evenly over the points, the first and the last kept.
 * Empty where the line has no heights.
 */
export function profileOf(line: readonly GeometryPoint[], most: number): Array<[number, number]> {
  const measured = line.filter(hasHeight);
  if (measured.length < 2 || measured.length !== line.length) return [];
  const along = metresAlong(measured);
  const samples = measured.map(([, , height], index): [number, number] => [along[index], height]);
  return thinnedLine(samples, most).map(([metres, height]): [number, number] => [
    Math.round(metres),
    Math.round(height),
  ]);
}

/**
 * A stretch added after the ones before it: joined to the last where it has
 * the same grade and starts where that one ends, so a stretch of unknown
 * grade between two of one grade keeps them apart. Changes `stretches`.
 */
export function addStretch(stretches: HikeSacSegment[], stretch: HikeSacSegment): HikeSacSegment[] {
  const last = stretches[stretches.length - 1];
  if (last && last.sac === stretch.sac && last.to_m === stretch.from_m) last.to_m = stretch.to_m;
  else stretches.push({ ...stretch });
  return stretches;
}

/** The ways under the line OpenStreetMap could grade, each once, in the order they are walked, at most `limit`. */
export function gradableWayIds(ways: readonly TracedWay[], limit: number): number[] {
  const ids = new Set<number>();
  for (const way of ways) {
    if (ids.size === limit) break;
    if (way.wayId !== null) ids.add(way.wayId);
  }
  return [...ids];
}

/**
 * The SAC grades laid onto the line: each way's grade over the stretch it
 * runs along, neighbours of one grade joined, how much of the line has none,
 * and the hardest grade found. The described line is matched by the router
 * and so a little longer or shorter than the planned one; its stretches are
 * scaled onto the planned length, so they meet the height profile. A way
 * without a grade, or one no source could be asked about, is unknown, never
 * easy.
 */
export function gradesAlong(
  ways: readonly TracedWay[],
  steps: ReadonlyMap<number, SacStep>,
  lengthM: number,
): HikeTrailGrades {
  const traced = ways.reduce((sum, way) => sum + way.metres, 0);
  const scale = traced > 0 && lengthM > 0 ? lengthM / traced : 1;
  const segments: HikeSacSegment[] = [];
  let at = 0;
  let unknown = 0;
  for (const way of ways) {
    const from = at;
    at += way.metres * scale;
    const sac = way.wayId === null ? undefined : steps.get(way.wayId);
    if (sac === undefined) unknown += at - from;
    else if (at > from) addStretch(segments, { from_m: from, to_m: at, sac });
  }
  const total = traced * scale;
  return {
    segments: segments.map((segment) => ({
      ...segment,
      from_m: Math.round(segment.from_m),
      to_m: Math.round(segment.to_m),
    })),
    highest: segments.length > 0 ? Math.max(...segments.map(({ sac }) => sac)) : null,
    unknown_share: total > 0 ? Math.min(1, Math.round((unknown / total) * 1000) / 1000) : 1,
  };
}
