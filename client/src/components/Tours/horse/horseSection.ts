import {
  haversineMetres,
  turnedSignposted,
  type HorseRoute,
  type HorseRouteSection,
  type TourFixedLeg,
} from '@trek/shared';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';

/**
 * HOR-01: a section of a horse route taken onto a ride. Pure, so the dialog's
 * preview and the step that changes the tour read the same answer.
 */

export type HorseSectionLeg = Extract<TourFixedLeg, { kind: 'horse_route' }>;

/**
 * How close a section has to start to the end of the ride to go on from that
 * point itself, in metres: the gap between two ways that meet in the data, not
 * a stretch of its own. Well inside the 60 metres a saved leg may lie off its
 * point.
 */
export const SECTION_JOINS_M = 25;

/** The section as a leg of the ride, in the direction chosen, with its route's name and its access. */
export function sectionLeg(route: HorseRoute, section: HorseRouteSection, reversed: boolean): HorseSectionLeg {
  const geometry = section.geometry.map(([lat, lng]): [number, number] => [lat, lng]);
  return {
    kind: 'horse_route',
    ref: route.id,
    name: (route.name ?? route.ref)?.slice(0, 255) ?? null,
    geometry: reversed ? geometry.reverse() : geometry,
    signposted: reversed ? turnedSignposted(section.signposted) : section.signposted,
    access: section.access,
  };
}

type Point = Pick<TourPlannerWaypoint, 'lat' | 'lng'>;

/** Metres from the ride's last point to where the leg starts; null while the ride has no point. */
export function sectionGapM(points: readonly Point[], leg: HorseSectionLeg): number | null {
  const last = points[points.length - 1];
  const start = leg.geometry[0];
  if (!last || !start) return null;
  return haversineMetres(last.lat, last.lng, Number(start[0]), Number(start[1]));
}

/**
 * The direction a section is offered in first: the one that starts nearer the
 * end of the ride, so it goes on from there; on an empty ride the one the
 * route is signposted in.
 */
export function preferReversed(points: readonly Point[], section: HorseRouteSection): boolean {
  const last = points[points.length - 1];
  const first = section.geometry[0];
  const end = section.geometry[section.geometry.length - 1];
  if (!last || !first || !end) return section.signposted === 'against';
  return haversineMetres(last.lat, last.lng, end[0], end[1]) < haversineMetres(last.lat, last.lng, first[0], first[1]);
}

/**
 * The ride with the section on its end, as one change. On an empty ride the
 * section is its first leg; where it starts at the ride's end it goes on from
 * that point; anywhere else it starts at a point of its own, and the gap to it
 * is left to the planner, which draws it by hand once the rider has agreed.
 */
export function withSectionAppended(
  points: readonly TourPlannerWaypoint[],
  leg: HorseSectionLeg,
  newId: () => string
): TourPlannerWaypoint[] {
  const [startLat, startLng] = leg.geometry[0] as [number, number];
  const [endLat, endLng] = leg.geometry[leg.geometry.length - 1] as [number, number];
  const end: TourPlannerWaypoint = { id: newId(), lat: endLat, lng: endLng, role: 'end' };
  const gap = sectionGapM(points, leg);
  if (gap !== null && gap <= SECTION_JOINS_M) {
    const last = points[points.length - 1] as TourPlannerWaypoint;
    return [...points.slice(0, -1), { ...last, fixedLeg: leg }, end];
  }
  return [...points, { id: newId(), lat: startLat, lng: startLng, role: 'via', fixedLeg: leg }, end];
}

/** A route's name as the rider reads it: its own, else its reference, else said to have none. */
export function horseRouteTitle(route: HorseRoute, t: (key: string) => string): string {
  return route.name ?? route.ref ?? t('tours.horse.routes.unnamed');
}
