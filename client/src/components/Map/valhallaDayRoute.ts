import { sameRoad } from '@trek/shared';

import { useSettingsStore } from '../../store/settingsStore';
import type { RouteSegment, RouteWithLegs, Waypoint } from '../../types';
import { haversineKm } from '../../utils/geo';
import type { RouteAlternative } from './RouteCalculator';
import { formatDuration, formatRouteDistance } from './routeText';
import { countRoute } from './routeUsageCounter';
import {
  legAvoids,
  valhallaAvailable,
  valhallaDayAlternates,
  valhallaDayRun,
  valhallaRouteAvoiding,
  valhallaSpacing,
  type AvoidClass,
  type ValhallaLeg,
} from './valhallaRoute';

type Profile = 'driving' | 'walking' | 'cycling';

/**
 * Road classes worth asking the router to leave out, in the order they are tried.
 *
 * OSRM's own alternative search is conservative: it only offers a second road when the
 * detour is short enough and shares little enough with the first, so on a long motorway
 * run it usually answers with exactly one route, while a perfectly good, slower way over
 * the B-roads exists and is what somebody opening "other ways" is looking for. Excluding
 * a class asks a different question and reliably produces that road.
 *
 * Only for driving: the foot and bike profiles have no excludable classes, and asking
 * anyway earns an `InvalidOptions` for nothing.
 *
 * Ferry is on the list for Valhalla's sake and skipped on the OSRM path. OSRM does carry
 * a ferry class, but on a leg where a ferry is the only crossing it answers NoRoute
 * rather than the long way round, which is not an alternative anybody can use. Valhalla
 * weights it instead and drives around, which is the whole point.
 */
export const EXCLUDABLE_CLASSES = ['motorway', 'toll', 'ferry'] as const;

/**
 * What the usage counter is told about a question to this engine. Counted by hand
 * because it speaks to a different engine with a different verb, and the counter exists
 * to answer "how much routing does this instance do": an engine it cannot see is exactly
 * the traffic that would go missing from it.
 */
function usage(profile: Profile, surface: 'legs' | 'alternatives', points: readonly Waypoint[]) {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  const selfHosted = !!useSettingsStore.getState().settings.routing_base_url?.trim();
  return { profile, surface, selfHosted, waypoints: points.length, km };
}

/**
 * A whole day from Valhalla, shaped exactly like the OSRM answer so the callers never
 * branch on which engine spoke: same leg list, same formatted text, same snap positions.
 *
 * A day that weighs classes away adds `avoidance`: what was asked for against what the
 * road actually turned out to be, which is the only honest way to label a weighting that
 * can fail. A day that avoids nothing has no such question and leaves it out.
 *
 * Null rather than a throw when it cannot answer, so the caller routes the whole day
 * with OSRM and the day stays drawn.
 */
export async function valhallaDayRoute(
  waypoints: Waypoint[],
  profile: Profile,
  avoid: AvoidClass[],
  signal?: AbortSignal
): Promise<RouteWithLegs | null> {
  const sample = usage(profile, 'legs', waypoints);
  const run = await valhallaDayRun(waypoints, profile, avoid, signal);
  if (!signal?.aborted) countRoute({ ...sample, failed: !run });
  if (!run) return null;

  const legs: RouteSegment[] = run.legs.map((leg, i): RouteSegment => {
    const from: [number, number] = [waypoints[i].lat, waypoints[i].lng];
    const to: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng];
    return {
      mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
      from,
      to,
      distance: leg.distance,
      duration: leg.duration,
      walkingText: formatDuration(leg.distance / (5000 / 3600)),
      drivingText: formatDuration(leg.duration),
      distanceText: formatRouteDistance(leg.distance),
      durationText: formatDuration(leg.duration),
    };
  });

  return {
    coordinates: run.total.coordinates,
    distance: run.total.distance,
    duration: run.total.duration,
    legs,
    snapped: run.snapped,
    ...(avoid.length
      ? { avoidance: { asked: avoid, achieved: avoid.filter((cls) => legAvoids(run.total, cls)) } }
      : {}),
    hasFerry: run.total.hasFerry,
  };
}

/** A Valhalla leg as an offer, carrying the engine that priced it and what it crosses. */
function valhallaOffer(leg: ValhallaLeg): RouteAlternative {
  return {
    coordinates: leg.coordinates,
    distance: leg.distance,
    duration: leg.duration,
    divergence: null,
    engine: 'valhalla',
    hasFerry: leg.hasFerry,
  };
}

/**
 * The same leg from Valhalla, weighted away from one class, or null.
 *
 * The check that makes this honest is `legAvoids`: `use_tolls: 0` is a preference, so
 * between two points with no untolled connection the answer is still a tolled road.
 * Offering that as "No tolls" would put a lie on the map, so it is dropped and the
 * OSRM attempt gets its turn.
 */
export async function valhallaExcluding(
  from: Waypoint,
  to: Waypoint,
  profile: Profile,
  exclude: AvoidClass,
  signal?: AbortSignal
): Promise<RouteAlternative | null> {
  if (!valhallaAvailable()) return null;
  const sample = usage(profile, 'alternatives', [from, to]);
  const leg = await valhallaRouteAvoiding(from, to, profile, exclude, signal);
  if (!signal?.aborted) countRoute({ ...sample, failed: !leg });
  if (!leg || !legAvoids(leg, exclude)) return null;
  return valhallaOffer(leg);
}

/**
 * The offers for one leg of a day Valhalla routes, every one of them Valhalla's and
 * weighed the way the day was, or null when it has nothing to say. Quietly offering
 * OSRM's roads beside a Valhalla day is the mix that offered a road the rail was not on
 * as the quicker one, and clicking it changed nothing.
 *
 * Where the router offers a single way, a driving leg gets the question the OSRM path
 * asks too: the same drive with one more class left out, only of those the day does not
 * already avoid, and only where the road that comes back really is without it. Paced
 * like the pieces of a split day, because the public instance allows one request a second.
 */
export async function valhallaDayAlternatives(
  from: Waypoint,
  to: Waypoint,
  profile: Profile,
  avoiding: AvoidClass[],
  { limit, signal }: { limit: number; signal?: AbortSignal }
): Promise<RouteAlternative[] | null> {
  const sample = usage(profile, 'alternatives', [from, to]);
  const answered = await valhallaDayAlternates(from, to, profile, avoiding, { count: Math.max(0, limit - 1), signal });
  if (!signal?.aborted) countRoute({ ...sample, failed: !answered });
  if (!answered?.length) return null;

  const routes: RouteAlternative[] = [];
  for (const leg of answered) {
    const offer = valhallaOffer(leg);
    if (!routes.some((r) => sameRoad(r, offer))) routes.push(offer);
  }
  if (routes.length >= 2 || profile !== 'driving') return routes;

  for (const cls of EXCLUDABLE_CLASSES) {
    if (avoiding.includes(cls)) continue;
    await valhallaSpacing(signal);
    if (signal?.aborted) break;
    const run = await valhallaDayRun([from, to], 'driving', [...avoiding, cls], signal);
    if (!signal?.aborted) countRoute({ ...sample, failed: !run });
    if (!run || !legAvoids(run.total, cls)) continue;
    const detour = valhallaOffer(run.total);
    if (routes.some((r) => sameRoad(r, detour))) continue;
    routes.push({ ...detour, avoids: cls });
    break;
  }
  return routes;
}
