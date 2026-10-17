import { haversineKm } from '../../../utils/geo';
import { valhallaRun } from '../../Map/valhallaRoute';
import { lineLengthM } from '../planner/tourFixedLegs';

type Point = { lat: number; lng: number };

/**
 * How much longer than the straight line a carry along the ways may be before
 * it counts as a detour: a way round a fenced lock is fine, a walk round the
 * whole lake is not, and then the straight line says more.
 */
const DETOUR = { factor: 2.5, extraM: 300 } as const;

/** Paths a paddler carries a boat on: plain hiking ground, never a scramble. */
const CARRY_DIFFICULTY = 1;

/**
 * PAD-03: the way a portage takes on land, from where the boat leaves the
 * water to where it goes in again, on the ways a walker would take (the
 * instance's Valhalla, the router the hikes use). The line starts and ends at
 * the two points themselves, so the steps from the bank onto the path are
 * part of it. Null when no router answers, or when the way is a detour.
 */
export async function routePortageLine(
  from: Point,
  to: Point,
  signal?: AbortSignal
): Promise<[number, number][] | null> {
  // The router answers null, never throws, when it cannot be reached; the carry then stays straight.
  const run = await valhallaRun([from, to], 'walking', [], signal, { max_hiking_difficulty: CARRY_DIFFICULTY });
  if (!run || run.total.coordinates.length < 2) return null;
  const line: [number, number][] = [[from.lat, from.lng], ...run.total.coordinates, [to.lat, to.lng]];
  const straightM = haversineKm(from, to) * 1000;
  if (lineLengthM(line) > Math.max(straightM * DETOUR.factor, straightM + DETOUR.extraM)) return null;
  return line;
}
