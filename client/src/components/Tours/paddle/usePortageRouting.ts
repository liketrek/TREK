import type { TourFixedLeg } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourPlannerController } from '../planner/useTourPlanner';
import type { PortageWay } from './PaddleWaypointParts';
import { routePortageLine } from './portageRoute';

type Planner = Pick<
  TourPlannerController,
  'waypoints' | 'isPaddle' | 'hasUnsavedChanges' | 'amendWaypoints' | 'editPaddlePoints'
>;
type Point = TourPlannerController['waypoints'][number];
type Line = [number, number][];

/** A portage leg by its two ends, to six decimals (about ten centimetres): the same carry asks once. */
function keyOf(from: Point, to: Point): string {
  return `${from.lat.toFixed(6)},${from.lng.toFixed(6)}>${to.lat.toFixed(6)},${to.lng.toFixed(6)}`;
}

function isStraightPortage(leg: TourFixedLeg | null | undefined): boolean {
  return leg?.kind === 'portage' && leg.geometry.length === 2;
}

/** The portages still drawn straight, with the point after each. */
function straightPortages(points: readonly Point[]) {
  return points.flatMap((point, index) => {
    const next = points[index + 1];
    // A portage the water router found is its own: it already follows the mapped way.
    return next && !point.auto && isStraightPortage(point.fixedLeg)
      ? [{ id: point.id, from: point, to: next, key: keyOf(point, next) }]
      : [];
  });
}

/**
 * PAD-03: a portage follows the ways on land instead of cutting straight
 * across them. A portage the paddler sets, or whose ends they move, is asked
 * of the router the hikes use and takes its line, unless that line is a
 * detour; then it stays straight. A tour opened as saved keeps its straight
 * portages until the paddler asks for the way (`follow`), and one they set
 * straight on purpose (`straighten`) stays so.
 */
export function usePortageRouting(planner: Planner, editable: boolean) {
  const { waypoints, isPaddle, hasUnsavedChanges, amendWaypoints, editPaddlePoints } = planner;
  /** Carries kept straight: as the tour was saved, or as the paddler set them. */
  const kept = useRef(new Set<string>());
  /** What the router answered per carry; null when it found no way worth taking. */
  const lines = useRef(new Map<string, Line | null>());

  const layIn = useCallback(() => {
    amendWaypoints((current) => {
      let changed = false;
      const next = current.map((point, index) => {
        const after = current[index + 1];
        const leg = point.fixedLeg;
        if (!after || point.auto || !leg || leg.kind !== 'portage' || leg.geometry.length !== 2) return point;
        const key = keyOf(point, after);
        const line = kept.current.has(key) ? null : lines.current.get(key);
        if (!line) return point;
        changed = true;
        return { ...point, fixedLeg: { ...leg, geometry: line } };
      });
      return changed ? next : current;
    });
  }, [amendWaypoints]);

  useEffect(() => {
    if (!isPaddle || !editable) return undefined;
    const legs = straightPortages(waypoints);
    if (!hasUnsavedChanges) {
      for (const leg of legs) kept.current.add(leg.key);
      return undefined;
    }
    const wanted = legs.filter((leg) => !kept.current.has(leg.key));
    if (wanted.some((leg) => lines.current.get(leg.key))) layIn();
    const missing = wanted.filter((leg) => !lines.current.has(leg.key));
    if (missing.length === 0) return undefined;
    const abort = new AbortController();
    // One after the other: the public router allows about one request a second.
    void missing
      .reduce(async (previous, leg) => {
        await previous;
        if (abort.signal.aborted) return;
        const line = await routePortageLine(leg.from, leg.to, abort.signal);
        if (!abort.signal.aborted) lines.current.set(leg.key, line);
      }, Promise.resolve())
      .then(() => {
        if (!abort.signal.aborted) layIn();
      });
    return () => abort.abort();
  }, [editable, hasUnsavedChanges, isPaddle, layIn, waypoints]);

  /** The carries starting at these points, each with the point after it. */
  const legsOf = useCallback(
    (ids: readonly string[]) =>
      waypoints.flatMap((point, index) => {
        const next = waypoints[index + 1];
        return ids.includes(point.id) && next ? [{ point, next, key: keyOf(point, next) }] : [];
      }),
    [waypoints]
  );

  /**
   * A portage laid on the ways, after it was straight (as saved, or set so),
   * leg by leg: true once one follows them, false when there is no way worth
   * taking and it stays straight.
   */
  const follow = useCallback(
    async (ids: readonly string[]) => {
      const legs = legsOf(ids);
      const found = await legs.reduce(async (previous, { point, next, key }) => {
        const any = await previous;
        kept.current.delete(key);
        const line = await routePortageLine(point, next);
        lines.current.set(key, line);
        return any || !!line;
      }, Promise.resolve(false));
      if (found) layIn();
      return found;
    },
    [layIn, legsOf]
  );

  /** A portage drawn straight, and kept so. */
  const straighten = useCallback(
    (ids: readonly string[]) => {
      for (const { key } of legsOf(ids)) kept.current.add(key);
      editPaddlePoints((current) =>
        current.map((point, index) => {
          const next = current[index + 1];
          const leg = point.fixedLeg;
          if (!ids.includes(point.id) || !next || leg?.kind !== 'portage') return point;
          return {
            ...point,
            fixedLeg: {
              ...leg,
              geometry: [
                [point.lat, point.lng],
                [next.lat, next.lng],
              ],
            },
          };
        })
      );
    },
    [editPaddlePoints, legsOf]
  );

  /** Whether the router found no way worth taking for every leg of a portage. */
  const noWay = useCallback(
    (ids: readonly string[]) => {
      const legs = legsOf(ids);
      return legs.length > 0 && legs.every(({ key }) => lines.current.get(key) === null);
    },
    [legsOf]
  );

  return { follow, straighten, noWay };
}

type PortageRouting = ReturnType<typeof usePortageRouting>;

/** The waypoints whose legs make up the portage starting at `index`: one leg, or several in a row. */
function portageRunIds(points: readonly Point[], index: number): string[] {
  const ids: string[] = [];
  for (let at = index; at < points.length - 1 && points[at]?.fixedLeg?.kind === 'portage'; at += 1) {
    ids.push(points[at].id);
  }
  return ids;
}

/**
 * PAD-03: the way of the portage starting at a waypoint, for its card:
 * whether it follows the ways on land, why it stayed straight, and the switch
 * between the two. Undefined where no portage starts.
 */
export function usePortageWay(
  points: readonly Point[],
  routing: PortageRouting,
  index: number
): PortageWay | undefined {
  const [searching, setSearching] = useState(false);
  const ids = portageRunIds(points, index);
  if (ids.length === 0) return undefined;
  return {
    routed: ids.every((id) => (points.find((point) => point.id === id)?.fixedLeg?.geometry.length ?? 0) > 2),
    noWay: routing.noWay(ids),
    searching,
    onFollow: () => {
      setSearching(true);
      void routing.follow(ids).finally(() => setSearching(false));
    },
    onStraighten: () => routing.straighten(ids),
  };
}
