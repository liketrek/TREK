import type { TourFixedLeg } from './tours.schema';
import type { WalkBoats } from './walk-hours';

type LinePoint = readonly [number, number, ...number[]];
type FerryLeg = Extract<TourFixedLeg, { kind: 'ferry' }>;

/** Closer than this, in degrees, a point of the saved line is the point of a leg it was built from. */
const SAME_POINT_DEG = 1e-6;

/** CW-12: a ferry leg of a city walk as its times read it: the boat parts of its line in order, and their minutes. */
export interface WalkFerryLeg {
  crossings: Array<Array<[number, number]>>;
  /** Null where the router gave the boat no time. */
  minutes: number | null;
}

function crossingLines(leg: FerryLeg): Array<Array<[number, number]>> {
  return leg.crossings.map(([from, to]) =>
    leg.geometry.slice(from, to + 1).map(([lat, lng]): [number, number] => [lat, lng]),
  );
}

/** CW-12: the ferry legs of a city walk, in the order of its legs. */
export function ferryLegsOf(points: ReadonlyArray<{ fixed_leg?: TourFixedLeg | null }>): WalkFerryLeg[] {
  return points.flatMap((point) => {
    const leg = point.fixed_leg;
    return leg?.kind === 'ferry' ? [{ crossings: crossingLines(leg), minutes: leg.minutes }] : [];
  });
}

/** CW-12: the boat part of each ferry leg of a city walk, each stretch by boat on its own, in the order of the legs. */
export function ferryCrossingsOf(
  points: ReadonlyArray<{ fixed_leg?: TourFixedLeg | null }>,
): Array<Array<[number, number]>> {
  return ferryLegsOf(points).flatMap((leg) => leg.crossings);
}

/**
 * CW-12: the minutes a city walk spends on the boat: the sum over its ferry
 * legs, null while one of them has no time, undefined for a walk without any.
 */
export function walkFerryMinutesOf(
  points: ReadonlyArray<{ fixed_leg?: TourFixedLeg | null }>,
): number | null | undefined {
  const legs = ferryLegsOf(points);
  if (legs.length === 0) return undefined;
  return legs.every((leg) => leg.minutes !== null) ? legs.reduce((sum, leg) => sum + (leg.minutes ?? 0), 0) : null;
}

function indexOfPoint(line: ReadonlyArray<LinePoint>, point: readonly [number, number], from: number): number {
  for (let index = from; index < line.length; index += 1) {
    const at = line[index];
    if (at && Math.abs(at[0] - point[0]) < SAME_POINT_DEG && Math.abs(at[1] - point[1]) < SAME_POINT_DEG) return index;
  }
  return -1;
}

/** One crossing's span on the line, searched from `from` on; null where its points are not found in turn. */
function spanOf(
  line: ReadonlyArray<LinePoint>,
  crossing: ReadonlyArray<readonly [number, number]>,
  from: number,
): [number, number] | null {
  const first = crossing[0];
  const last = crossing[crossing.length - 1];
  if (!first || !last || crossing.length < 2) return null;
  const start = indexOfPoint(line, first, from);
  const end = start < 0 ? -1 : indexOfPoint(line, last, start + 1);
  return end < 0 ? null : [start, end];
}

/**
 * Where on a walk's saved line its crossings by boat run, as the indices of the
 * points the boat leaves from and lands at. The line was put together from the
 * legs as they are, so each crossing is found by its own points in turn; one
 * that cannot be found is left out rather than guessed.
 */
export function boatSpansOf(
  line: ReadonlyArray<LinePoint>,
  crossings: ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
): Array<[number, number]> {
  return boatsAlong(
    line,
    crossings.map((crossing) => ({ crossings: [crossing], minutes: null })),
  ).spans;
}

/**
 * CW-12: a walk's ferry legs found on its saved line: the spans by boat, and
 * for each leg the point its last boat lands at with the minutes of its boats,
 * so a stop after it is reached that much later. A leg none of whose
 * crossings is found adds no time rather than a guessed one.
 */
export function boatsAlong(
  line: ReadonlyArray<LinePoint>,
  legs: ReadonlyArray<
    Pick<WalkFerryLeg, 'minutes'> & { crossings: ReadonlyArray<ReadonlyArray<readonly [number, number]>> }
  >,
): WalkBoats {
  const boats: WalkBoats = { spans: [], landings: [] };
  let from = 0;
  for (const leg of legs) {
    let landed = -1;
    for (const crossing of leg.crossings) {
      const span = spanOf(line, crossing, from);
      if (!span) continue;
      boats.spans.push(span);
      landed = span[1];
      from = span[1];
    }
    if (landed >= 0) boats.landings.push({ at: landed, minutes: leg.minutes });
  }
  return boats;
}
