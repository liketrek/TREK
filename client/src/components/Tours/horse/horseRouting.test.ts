import type { TourFixedLeg } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { normalizePlannerWaypoints, tourWaypointKey, type TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { toggleFreeLeg } from '../planner/tourRouteActions';
import { rideTour, routeWalkingTour } from '../planner/tourRouting';
import { tourMapLayersFor } from '../tourMapLayers';

// FE-HORSE-ROUTE-001 to FE-HORSE-ROUTE-006

const section: TourFixedLeg = {
  kind: 'horse_route',
  ref: 'relation/42',
  name: 'Reitweg',
  geometry: [
    [48, 11],
    [48.005, 11],
    [48.01, 11],
  ],
  signposted: null,
  access: [],
};
const drawn: TourFixedLeg = {
  kind: 'free',
  geometry: [
    [48.01, 11],
    [48.011, 11],
  ],
};
const at = (id: string, lat: number, lng: number, fixedLeg?: TourFixedLeg): TourPlannerWaypoint => ({
  id,
  lat,
  lng,
  role: 'via',
  ...(fixedLeg ? { fixedLeg } : {}),
});

describe('a ride on the planner (HOR-01)', () => {
  it('FE-HORSE-ROUTE-001: puts a ride together from its legs, a section as it is, a drawn leg sampled, no time', () => {
    const ride = rideTour([at('a', 48, 11, section), at('b', 48.01, 11, drawn), at('c', 48.011, 11)]);
    expect(ride).not.toBeNull();
    expect(ride?.coordinates.slice(0, 3)).toEqual(section.geometry);
    expect(ride?.coordinates[ride.coordinates.length - 1]).toEqual([48.011, 11]);
    expect(ride?.parts.map((part) => part.free)).toEqual([false, true]);
    // The drawn leg of about 111 m gets points along it, so its heights follow the ground.
    expect(ride?.parts[1]?.coordinates.length).toBeGreaterThan(2);
    expect(ride?.distanceMeters).toBeCloseTo(1223, -1);
    expect(ride?.durationSeconds).toBeNull();
  });

  it('FE-HORSE-ROUTE-002: has no line while a leg has none of its own, or before there is a leg', () => {
    expect(rideTour([at('a', 48, 11), at('b', 48.01, 11)])).toBeNull();
    expect(rideTour([at('a', 48, 11)])).toBeNull();
  });

  it('FE-HORSE-ROUTE-003: no router plans a section of a horse route on another type', async () => {
    await expect(routeWalkingTour([at('a', 48, 11, section), at('b', 48.01, 11)])).resolves.toBeNull();
  });

  it('FE-HORSE-ROUTE-004: keeps a section when its leg is asked to be drawn by hand', () => {
    const points = [at('a', 48, 11, section), at('b', 48.01, 11)];
    expect(toggleFreeLeg(points, 'a')).toEqual(points);
  });

  it('FE-HORSE-ROUTE-005: normalises a draft for its type, a ride all fixed, another type without sections', () => {
    const points = [at('a', 47.99, 11), at('b', 48, 11, section), at('c', 48.01, 11)];
    const ride = normalizePlannerWaypoints(points, 'horse');
    expect(ride.map((point) => [point.role, point.fixedLeg?.kind ?? null])).toEqual([
      ['start', 'free'],
      ['via', 'horse_route'],
      ['end', null],
    ]);
    expect(normalizePlannerWaypoints(points).map((point) => point.fixedLeg?.kind ?? null)).toEqual([null, null, null]);
    // A section taken the other way round is another route for the planner.
    const turned = { ...section, geometry: [...section.geometry].reverse() };
    expect(tourWaypointKey([at('x', 48, 11, section)])).not.toBe(tourWaypointKey([at('x', 48, 11, turned)]));
  });

  it('FE-HORSE-ROUTE-006: a ride offers the standard map, topo and satellite, and no via ferratas', () => {
    expect(tourMapLayersFor('horse')).toEqual({
      bases: ['default', 'topo', 'satellite'],
      defaultBase: 'default',
      overlays: [],
    });
  });
});
