/**
 * RTE-03: the plain geometry a round hike is searched with. Where the loop is
 * steered through, and how much of a routed line covers the same ground twice
 * or the ground of another line. Nothing here asks a router: the planner in
 * the browser and the assistant on the server search with the same rules.
 */

type Spot = { lat: number; lng: number };
type Line = readonly (readonly [number, number])[];

const EARTH_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** The spot `meters` away from `from` toward `bearingDeg` (clockwise from north), on the sphere. */
export function spotToward(from: Spot, bearingDeg: number, meters: number): Spot {
  const angle = meters / EARTH_M;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angle) + Math.cos(lat1) * Math.sin(angle) * Math.cos(bearing));
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(bearing) * Math.sin(angle) * Math.cos(lat1), Math.cos(angle) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: toDeg(lat2), lng: ((toDeg(lng2) + 540) % 360) - 180 };
}

/** The loop's length in straight lines from corner to corner, per metre of its circle's radius: a square's. */
export const STRAIGHT_PER_RADIUS_M = 4 * Math.SQRT2;

/**
 * The three spots a loop out of `start` is steered through: the other corners
 * of a square in a circle of `radiusM` that touches the start, its centre
 * toward `bearingDeg`. Walked in order, the loop goes round the circle once
 * and comes back to the start from the other side.
 */
export function loopSpots(start: Spot, bearingDeg: number, radiusM: number): Spot[] {
  const centre = spotToward(start, bearingDeg, radiusM);
  // Seen from the centre the start lies the other way; the corners follow it a quarter turn apart.
  const towardStart = bearingDeg + 180;
  return [90, 180, 270].map((turn) => spotToward(centre, towardStart + turn, radiusM));
}

/** Samples are taken along a line this far apart. */
const SAMPLE_M = 20;
/** Two samples this close lie on the same ground: about the width of a path and the router's drawing of it. */
const SAME_GROUND_M = 25;
/**
 * Ground passed twice only counts when the two passes lie this far apart
 * along the line: the samples next to one another on a bend are one pass.
 */
const SECOND_PASS_M = 300;

interface Sample {
  x: number;
  y: number;
  along: number;
}

type Projector = (point: readonly [number, number]) => { x: number; y: number };

/** A flat projection in metres around one latitude, good for the few kilometres a hike spans. */
function projector(refLat: number): Projector {
  const perDegLat = (Math.PI * EARTH_M) / 180;
  const perDegLng = perDegLat * Math.cos(toRad(refLat));
  return ([lat, lng]) => ({ x: lng * perDegLng, y: lat * perDegLat });
}

/** The line as samples every few metres, each with how far along the line it lies. */
function samplesOf(line: Line, project: Projector): Sample[] {
  const samples: Sample[] = [];
  let along = 0;
  let next = 0;
  for (let i = 1; i < line.length; i += 1) {
    const before = line[i - 1];
    const here = line[i];
    if (!before || !here) continue;
    const a = project(before);
    const b = project(here);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    while (next <= along + length) {
      const share = length > 0 ? (next - along) / length : 0;
      samples.push({ x: a.x + (b.x - a.x) * share, y: a.y + (b.y - a.y) * share, along: next });
      next += SAMPLE_M;
    }
    along += length;
  }
  return samples;
}

const cellOf = (value: number) => Math.floor(value / SAME_GROUND_M);

/** The samples by the grid cell they lie in, so a neighbour is looked for among a few, not all. */
function gridOf(samples: readonly Sample[]): Map<string, Sample[]> {
  const grid = new Map<string, Sample[]>();
  for (const sample of samples) {
    const key = `${cellOf(sample.x)}:${cellOf(sample.y)}`;
    const cell = grid.get(key);
    if (cell) cell.push(sample);
    else grid.set(key, [sample]);
  }
  return grid;
}

/** Whether a sample of `grid` that `counts` lies on the same ground as `sample`. */
function hasNeighbour(grid: Map<string, Sample[]>, sample: Sample, counts: (other: Sample) => boolean): boolean {
  const cx = cellOf(sample.x);
  const cy = cellOf(sample.y);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const near = grid
        .get(`${cx + dx}:${cy + dy}`)
        ?.some((other) => Math.hypot(other.x - sample.x, other.y - sample.y) <= SAME_GROUND_M && counts(other));
      if (near) return true;
    }
  }
  return false;
}

/**
 * The share of a line that covers ground it passes a second time, from 0 to
 * 1. A loop with a short way in and out shares little; the same way there and
 * back shares all of it.
 */
export function retracedShare(line: Line): number {
  const first = line[0];
  if (!first || line.length < 2) return 0;
  const samples = samplesOf(line, projector(first[0]));
  if (samples.length < 2) return 0;
  const grid = gridOf(samples);
  const twice = samples.filter((sample) =>
    hasNeighbour(grid, sample, (other) => Math.abs(other.along - sample.along) > SECOND_PASS_M),
  ).length;
  return twice / samples.length;
}

/** The share of line `a` that lies on the ground of line `b`, from 0 to 1. */
export function sharedShare(a: Line, b: Line): number {
  const first = a[0];
  if (!first || a.length < 2 || b.length < 2) return 0;
  const project = projector(first[0]);
  const samples = samplesOf(a, project);
  if (samples.length === 0) return 0;
  const grid = gridOf(samplesOf(b, project));
  const shared = samples.filter((sample) => hasNeighbour(grid, sample, () => true)).length;
  return shared / samples.length;
}
