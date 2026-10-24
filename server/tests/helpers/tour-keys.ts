import { expect } from 'vitest';

/** The key a point was sent with, if any. */
const sentKey = (point: object): unknown => ('key' in point ? point.key : undefined);

/**
 * CW-03: the points of a save as the server keeps them. Every point carries a
 * station key: the one it was sent with, or a fresh one in the shape of
 * `stationKeySchema` where it came without.
 */
export function keyed<T extends object>(points: readonly T[]): Array<T & { key: unknown }> {
  return points.map((point) => ({ ...point, key: sentKey(point) ?? expect.stringMatching(/^[A-Za-z0-9_-]{6,64}$/) }));
}
