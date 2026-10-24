import { haversineKm } from '../roadtrip/corridor';

/**
 * Whether two routed lines are one way, and how a way the router offered is
 * held with a few points pinned on it. The road trip's other roads, the
 * planner's other ways of a hike's section and the assistant's ways of a leg
 * all decide with these, so the browser and the server agree on what counts
 * as another way and on what holds it.
 */

type LinePoint = [number, number];

/** What two routes are compared by: their line, and their figures where there is none. */
export interface RoadLine {
  coordinates: LinePoint[];
  distance: number;
  duration: number;
}

/**
 * How far two lines may stray from each other and still be the same road, in kilometres.
 *
 * Parallel carriageways, a different slip road onto the same motorway and the noise
 * between two engines' idea of where a road is all sit well under this. A way somebody
 * would call an alternative leaves it by kilometres: the ferry-free run from Hamburg to
 * Copenhagen, which is a genuinely different road, peaks 2.3 km off the default.
 */
const SAME_ROAD_KM = 0.5;

/** The point of segment a-b closest to `p`, with longitude scaled by `cos` so the plane is fair. */
function closestOnSegment(p: LinePoint, a: LinePoint, b: LinePoint, cos: number): LinePoint {
  const dx = (b[1] - a[1]) * cos;
  const dy = b[0] - a[0];
  const length = dx * dx + dy * dy;
  if (length === 0) return a;
  const t = Math.max(0, Math.min(1, ((p[1] - a[1]) * cos * dx + (p[0] - a[0]) * dy) / length));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Where `reference` passes closest to `point`, as a squared distance in the same scaled
 * degrees and the spot on the line it was measured to.
 *
 * Coarse, then fine. The sampled vertices find the stretch, and the segments either side
 * of the nearest one find the road itself. Measured to the sampled vertex alone, a point
 * on the very same road sat up to half a sample apart from it, which on a thousand
 * kilometre leg is kilometres: two engines' lines of one motorway then read as two roads.
 */
function nearestOn(point: LinePoint, reference: readonly LinePoint[], step: number): { d: number; at: LinePoint } {
  const cos = Math.cos((point[0] * Math.PI) / 180);
  const squared = (p: LinePoint): number => {
    const dLat = point[0] - p[0];
    const dLng = (point[1] - p[1]) * cos;
    return dLat * dLat + dLng * dLng;
  };
  let nearestIndex = 0;
  let nearest = Infinity;
  for (let j = 0; j < reference.length; j += step) {
    const vertex = reference[j];
    if (!vertex) continue;
    const d = squared(vertex);
    if (d < nearest) {
      nearest = d;
      nearestIndex = j;
    }
  }
  let at = reference[nearestIndex] ?? point;
  const last = Math.min(reference.length - 1, nearestIndex + step);
  for (let k = Math.max(0, nearestIndex - step); k < last; k++) {
    const a = reference[k];
    const b = reference[k + 1];
    if (!a || !b) continue;
    const on = closestOnSegment(point, a, b, cos);
    const d = squared(on);
    if (d < nearest) {
      nearest = d;
      at = on;
    }
  }
  return { d: nearest, at };
}

/**
 * The point of `line` that lies furthest from `reference`, plus how far off it actually is.
 *
 * The search itself stays in squared degrees with a cosine on the longitude: it only has
 * to ORDER the candidates, and a haversine per pair of a 200-by-200 comparison buys
 * nothing for it. The winner is converted once at the end, because `sameRoad` needs a
 * real distance rather than a rank, and half a degree is a different number of metres in
 * Andalusia than in Lapland.
 *
 * `index` is where on `line` the point sits, so points taken off one line can be put back
 * in the order that line drives through them.
 */
export function furthestFrom(
  line: readonly LinePoint[],
  reference: readonly LinePoint[],
): { index: number; lat: number; lng: number; km: number } | null {
  if (!line.length || !reference.length) return null;
  // Every tenth vertex is plenty: alternatives differ over kilometres, not metres, and a
  // full cross product of two thousand-point lines is not worth the milliseconds.
  const step = Math.max(1, Math.floor(reference.length / 200));
  let bestIndex = -1;
  let bestNeighbour: LinePoint | null = null;
  let bestDist = -1;
  for (let i = 0; i < line.length; i += Math.max(1, Math.floor(line.length / 200))) {
    const vertex = line[i];
    if (!vertex) continue;
    const near = nearestOn(vertex, reference, step);
    if (near.d > bestDist) {
      bestDist = near.d;
      bestIndex = i;
      bestNeighbour = near.at;
    }
  }
  const best = line[bestIndex];
  if (!best) return null;
  const [lat, lng] = best;
  const km = bestNeighbour ? haversineKm({ lat, lng }, { lat: bestNeighbour[0], lng: bestNeighbour[1] }) : 0;
  return { index: bestIndex, lat, lng, km };
}

/**
 * Two lines are the same road.
 *
 * The geometry does not care which engine drew it, so it decides whenever there is one:
 * lengths and durations of the same road differ between engines by more than a real
 * detour does. The numbers stay as the fallback for a line with no shape to compare.
 *
 * Measured both ways round. Asked only whether `b` stays near `a`, a road that runs the
 * whole of `b` and then turns off to a point and back passed as `b`, because every point
 * of `b` is on it; that is exactly the shape of a leg bent by a via, and the picker and
 * the check behind a choice both have to tell it from the plain road.
 */
export function sameRoad(a: RoadLine, b: RoadLine): boolean {
  const there = furthestFrom(b.coordinates, a.coordinates);
  const back = furthestFrom(a.coordinates, b.coordinates);
  if (there && back) return Math.max(there.km, back.km) < SAME_ROAD_KM;
  return Math.abs(a.distance - b.distance) < 200 && Math.abs(a.duration - b.duration) < 60;
}

/**
 * The other ways among a router's offers between two points: every offer
 * after its first that is not a way already kept, at most `most`. The first
 * is the router's own way under the same rules, the one the route already
 * takes, so it is never one of them; `current` is that way as drawn now.
 */
export function otherWaysOf<T extends { coordinates: LinePoint[] }>(
  current: { coordinates: LinePoint[] },
  offers: readonly T[],
  most: number,
): T[] {
  const line = (way: { coordinates: LinePoint[] }): RoadLine => ({
    coordinates: way.coordinates,
    distance: 0,
    duration: 0,
  });
  const kept: T[] = [];
  for (const offer of offers.slice(1)) {
    if (kept.length >= most) break;
    const known = [current, ...kept].some((way) => sameRoad(line(way), line(offer)));
    if (!known) kept.push(offer);
  }
  return kept;
}

/** The most points one choice may pin to the way: every pin is one more question to a router that allows one a second. */
export const MAX_WAY_PINS = 3;

/** A point a choice is held by, in the order the chosen way runs through them. */
export interface WayPin {
  lat: number;
  lng: number;
}

/** Whether the router keeps to an offer, and the pins that make it do so. */
export interface PinnedWay<R> {
  /** True when the router took the offer with `pins` in place. */
  held: boolean;
  /** The pins that held it, in the order the offer runs through them. Empty otherwise. */
  pins: WayPin[];
  /** True when the last answer came from a stand-in engine, which proves nothing either way. */
  fellBack: boolean;
  /** The router's answer to the last attempt. */
  last: R;
}

/**
 * The fewest points that make the router take `offer`, found by asking it.
 *
 * The router's own preference (`offer.direct`) starts with no pin; any other offer with
 * the point furthest from the way taken now. After each answer that is not the offer,
 * the point of the offer furthest from that answer joins in, placed in the order the
 * offer runs through them, until the answer is the offer or `maxPins` is reached. An
 * answer from a stand-in engine proves nothing about the one that will draw the way, so
 * it ends the check without a verdict. Null once `signal` aborted: nothing more is asked.
 */
export async function pinWay<R extends RoadLine & { fellBack?: boolean }>({
  offer,
  current,
  route,
  signal,
  maxPins = MAX_WAY_PINS,
}: {
  offer: RoadLine & { direct?: boolean };
  /** The way taken now; the first pin is where the offer leaves it furthest. */
  current: RoadLine | undefined;
  route: (pins: WayPin[]) => Promise<R>;
  signal?: { readonly aborted: boolean };
  maxPins?: number;
}): Promise<PinnedWay<R> | null> {
  const placed: { index: number; lat: number; lng: number }[] = [];
  if (!offer.direct) {
    const far = furthestFrom(offer.coordinates, current?.coordinates ?? []);
    if (far) placed.push(far);
  }
  for (;;) {
    if (signal?.aborted) return null;
    const last = await route(placed.map(({ lat, lng }) => ({ lat, lng })));
    if (last.fellBack) return { held: false, pins: [], fellBack: true, last };
    if (sameRoad(last, offer)) {
      return { held: true, pins: placed.map(({ lat, lng }) => ({ lat, lng })), fellBack: false, last };
    }
    if (placed.length >= maxPins) return { held: false, pins: [], fellBack: false, last };
    const far = furthestFrom(offer.coordinates, last.coordinates);
    // The same point again would ask the same question and earn the same answer.
    if (!far || placed.some((p) => p.index === far.index)) return { held: false, pins: [], fellBack: false, last };
    placed.push(far);
    placed.sort((a, b) => a.index - b.index);
  }
}
