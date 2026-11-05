import { routeCacheRepo } from '../../repo/routeCacheRepo';
import type { RouteWithLegs } from '../../types';

/**
 * Route answers by RouteCalculator's cache key (profile, unit, waypoints,
 * avoided roads). Routes are stable, so this keeps the router from being asked
 * again on every day switch or reorder: in memory for this visit, and on the
 * device for the next one, so a trip that shows its whole route opens drawn
 * instead of routing every leg again, one a second (#2794).
 */
const inMemory = new Map<string, RouteWithLegs>();
const MEMORY_MAX = 200;

/** Keeps a route for this visit only, dropping the oldest past the limit. */
export function rememberRoute(key: string, route: RouteWithLegs): void {
  inMemory.set(key, route);
  if (inMemory.size > MEMORY_MAX) {
    const oldest = inMemory.keys().next().value;
    if (oldest !== undefined) inMemory.delete(oldest);
  }
}

/** The route this visit already holds, without asking the device. */
export function routeInMemory(key: string): RouteWithLegs | undefined {
  return inMemory.get(key);
}

/** Keeps a route the router just answered, in memory and on the device. */
export function cacheRoute(key: string, route: RouteWithLegs): void {
  rememberRoute(key, route);
  void routeCacheRepo.put(key, route);
}

/** The route kept in memory, else the one kept on the device, which then stays in memory too. */
export async function storedRoute(key: string): Promise<RouteWithLegs | null> {
  const held = inMemory.get(key);
  if (held) return held;
  const kept = await routeCacheRepo.get<RouteWithLegs>(key);
  if (kept) rememberRoute(key, kept);
  return kept;
}
