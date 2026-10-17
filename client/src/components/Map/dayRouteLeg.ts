import type { DistanceUnit, RouteSegment } from '../../types';
import { foldViaLegs, viasOnDayLeg, type DayViaLookup } from '../../utils/dayRouteVias';
import { calculateRouteWithLegs } from './RouteCalculator';

/** One end of a leg: a planned stop carries its assignment, which the vias are filed against. */
export type LegEnd = { lat: number; lng: number; assignmentId?: number };

/**
 * The drive between two points of a day as one leg, bent through the road trip's vias
 * between them and tagged with the mode it was routed in. Undefined when the router has
 * no road for it.
 */
export async function routeLeg(
  from: LegEnd,
  to: LegEnd,
  lookup: DayViaLookup | null,
  options: Parameters<typeof calculateRouteWithLegs>[1] & { profile: string; dayId: number },
  unit: DistanceUnit | undefined
): Promise<RouteSegment | undefined> {
  const vias = viasOnDayLeg(lookup, options.dayId, options.profile, from, to);
  try {
    const waypoints = [from, ...vias, to].map((p) => ({ lat: p.lat, lng: p.lng }));
    const r = await calculateRouteWithLegs(waypoints, options);
    const leg = foldViaLegs(r.legs, [0, vias.length + 1], unit)[0];
    return leg ? { ...leg, mode: options.profile } : undefined;
  } catch {
    return undefined;
  }
}
