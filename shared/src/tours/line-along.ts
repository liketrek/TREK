import { haversineMetres } from '../geo/haversine';
import { hikingTimeMinutes } from './tour-time-estimate';

/**
 * Measures along a planned line, in metres from its start, the way the
 * server answers a planned way and a chat card draws it: how far along each
 * point lies, where along the line a point beside it is nearest, and how a
 * walking time splits over the legs between the points a way was planned
 * through. Pure, for the server and the client alike.
 */

const RAD = Math.PI / 180;

/** A point of a line, `[lat, lng]`, with its height in metres where the line has one (null where it is unknown). */
export type AlongPoint = readonly [number, number, ...Array<number | null>];

/** One stretch of a line: its two ends and how far along the line each lies. */
interface Stretch {
  a: AlongPoint;
  b: AlongPoint;
  from: number;
  to: number;
}

/** Metres along the line at each of its points, the first at 0. */
export function cumulativeMetres(line: readonly AlongPoint[]): number[] {
  let along = 0;
  let before: AlongPoint | undefined;
  return line.map((point) => {
    if (before) along += haversineMetres(before[0], before[1], point[0], point[1]);
    before = point;
    return along;
  });
}

/** The stretches of a line in order, each with where along the line it starts and ends. */
function stretchesOf(line: readonly AlongPoint[]): Stretch[] {
  const along = cumulativeMetres(line);
  const stretches: Stretch[] = [];
  line.forEach((b, index) => {
    const a = line[index - 1];
    if (a) stretches.push({ a, b, from: along[index - 1] ?? 0, to: along[index] ?? 0 });
  });
  return stretches;
}

/**
 * Metres along the line to the spot of it nearest to a point, measured as
 * cumulativeMetres measures the line. Where the line passes the point twice
 * (a loop back to its start, a summit walked up and down one path) the first
 * pass counts. A line of fewer than two points gives 0.
 */
export function nearestAlongM(line: readonly AlongPoint[], lat: number, lng: number): number {
  // Laid flat around the point: east scaled by the latitude, so the nearest spot is found as on a map.
  const east = Math.cos(lat * RAD);
  let best = { gap: Number.POSITIVE_INFINITY, at: 0 };
  for (const { a, b, from, to } of stretchesOf(line)) {
    const dx = (b[1] - a[1]) * east;
    const dy = b[0] - a[0];
    const px = (lng - a[1]) * east;
    const py = lat - a[0];
    const span = dx * dx + dy * dy;
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / span));
    const gap = Math.hypot(px - t * dx, py - t * dy);
    if (gap < best.gap) best = { gap, at: from + t * (to - from) };
  }
  return best.at;
}

/** The height of a point, null where it has none. */
function heightOf(point: AlongPoint): number | null {
  const height = point[2];
  return typeof height === 'number' && Number.isFinite(height) ? height : null;
}

/** The climb and descent between two places along the line, each stretch counted for its part between them. */
function climbBetween(stretches: readonly Stretch[], from: number, to: number) {
  let climb = 0;
  let descent = 0;
  for (const stretch of stretches) {
    const inside = Math.min(to, stretch.to) - Math.max(from, stretch.from);
    const start = heightOf(stretch.a);
    const end = heightOf(stretch.b);
    if (inside <= 0 || stretch.to <= stretch.from || start === null || end === null) continue;
    const change = ((end - start) * inside) / (stretch.to - stretch.from);
    if (change > 0) climb += change;
    else descent -= change;
  }
  return { climb, descent };
}

/**
 * Whole numbers in proportion to `weights` that sum to `total` exactly: each
 * share rounded down, what is left over handed to the largest remainders.
 * Weights that are all nothing split the total evenly.
 */
function sharesOf(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((all, weight) => all + weight, 0);
  const parts = sum > 0 ? weights : weights.map(() => 1);
  const whole = parts.reduce((all, weight) => all + weight, 0);
  const exact = parts.map((weight) => (whole > 0 ? (weight * total) / whole : 0));
  const shares = exact.map((value) => Math.floor(value));
  let left = total - shares.reduce((all, share) => all + share, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { index } of order) {
    if (left <= 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    left -= 1;
  }
  return shares;
}

/**
 * The walking minutes of each leg between the points a way was planned
 * through (`atMs`, metres along the line in order), as the signposts' rule
 * (DIN 33466, hikingTimeMinutes) weighs the leg's length, climb and descent,
 * scaled so the legs sum to the way's whole time `total`. A line without
 * heights weighs the legs by their length alone. One leg fewer than points.
 */
export function legMinutes(line: readonly AlongPoint[], atMs: readonly number[], total: number): number[] {
  const stretches = stretchesOf(line);
  const weights = atMs.slice(1).map((to, index) => {
    const from = atMs[index] ?? 0;
    const length = Math.max(0, to - from);
    const { climb, descent } = climbBetween(stretches, from, from + length);
    // The rule rounds to whole minutes and scales with the leg, so it is asked of a leg a thousand times
    // as long and the answer shrunk back: a short leg keeps the seconds it walks instead of none.
    return hikingTimeMinutes(length, climb * 1000, descent * 1000) / 1000;
  });
  return sharesOf(weights, Math.max(0, Math.round(total)));
}

/**
 * How many of `most` points each of several lines gets for drawing, by its
 * length: at least two each, so every line keeps its ends, and never more
 * than its own points (`available`) where those are given.
 */
export function pointsPerLine(
  lengths: readonly number[],
  most: number,
  available: readonly number[] = lengths.map(() => Number.POSITIVE_INFINITY),
): number[] {
  const spare = Math.max(0, most - 2 * lengths.length);
  const extra = sharesOf(
    lengths.map((length) => Math.max(0, length)),
    spare,
  );
  return extra.map((share, index) => Math.max(2, Math.min(available[index] ?? 2, 2 + share)));
}

/** A planned leg as pointsPerLeg weighs it: its length in metres and how many points its line holds. */
export interface DrawnLeg {
  lengthM: number;
  points: number;
}

/**
 * How many of `most` points each leg of a plan draws with, shared by length
 * as pointsPerLine shares them, in the order of the legs. A leg that was not
 * planned (null) draws nothing and takes no share.
 */
export function pointsPerLeg(legs: ReadonlyArray<DrawnLeg | null>, most: number): Array<number | null> {
  const drawn = legs.filter((leg): leg is DrawnLeg => leg !== null);
  const shares = pointsPerLine(
    drawn.map((leg) => leg.lengthM),
    most,
    drawn.map((leg) => leg.points),
  ).reverse();
  return legs.map((leg) => (leg === null ? null : (shares.pop() ?? null)));
}
