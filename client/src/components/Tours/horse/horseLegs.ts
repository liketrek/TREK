import { freeLegBetween, type RoutePoint } from '../planner/tourRouteActions';

/**
 * HOR-01: the legs of a ride. Nothing of a ride is routed: a leg either
 * follows a section of a signposted horse route or is drawn by hand, straight
 * and unchecked. These keep a draft to that, whatever was done to it.
 */

/**
 * Every leg of a ride that follows no horse route drawn by hand: a leg the
 * router would have planned, a via ferrata, a section torn off its points by a
 * move. The last point has no leg.
 */
export function rideLegs<T extends RoutePoint>(points: readonly T[]): T[] {
  return points.map((point, index) => {
    const next = points[index + 1];
    const kind = point.fixedLeg?.kind;
    if (!next || kind === 'horse_route' || kind === 'free') return point;
    return { ...point, fixedLeg: freeLegBetween(point, next) };
  });
}

/** Any other type takes no section of a horse route: such a leg goes back to the router. */
export function withoutHorseRoutes<T extends RoutePoint>(points: readonly T[]): T[] {
  return points.map((point) => {
    if (point.fixedLeg?.kind !== 'horse_route') return point;
    const { fixedLeg: _section, ...routed } = point;
    return routed as T;
  });
}

/**
 * Whether a section of a horse route starts or ends at this point. Such a
 * point stays where the route has it: dragged away, the section would no
 * longer reach it and would have to give way to a straight line.
 */
export function holdsHorseSection(points: readonly RoutePoint[], id: string): boolean {
  const index = points.findIndex((point) => point.id === id);
  if (index < 0) return false;
  return points[index]?.fixedLeg?.kind === 'horse_route' || points[index - 1]?.fixedLeg?.kind === 'horse_route';
}
