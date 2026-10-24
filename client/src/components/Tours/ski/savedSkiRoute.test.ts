import { computeTourMetrics } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { skiRouteKey } from '../planner/skiRouting';
import { tourWaypointKey, type TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { savedSkiRoute, savedSkiSeed } from './savedSkiRoute';

// FE-TOUR-SKI-SAVED-001 to FE-TOUR-SKI-SAVED-004

const line: [number, number, number][] = [
  [47, 11, 1600],
  [47.005, 11.01, 1500],
  [47.01, 11.02, 1400],
];

const tour = {
  tour_type: 'ski' as const,
  ski_discipline: 'alpine' as const,
  distance: computeTourMetrics(line).distanceKm,
  duration: 25,
  ski_route_build: '2026-11-02',
  ski_planned_legs: [1],
};

describe('savedSkiRoute (SKI-02)', () => {
  it('FE-TOUR-SKI-SAVED-001: opens a saved ski tour with its line, heights, time, build and planned legs', () => {
    const route = savedSkiRoute(tour, JSON.stringify(line), 2);
    expect(route).toMatchObject({
      coordinates: line.map(([lat, lng]) => [lat, lng]),
      elevations: line,
      durationSeconds: 1500,
      build: '2026-11-02',
      plannedLegs: [1],
      saved: true,
      problems: [],
      attribution: null,
    });
    expect(route?.distanceMeters).toBeCloseTo(tour.distance * 1000, 6);
    expect(route?.parts).toEqual([{ coordinates: route?.coordinates, free: false }]);
    // The line may come as the place keeps it, or already read.
    expect(savedSkiRoute(tour, line, 2)?.saved).toBe(true);
    expect(savedSkiRoute({ ...tour, duration: null }, line, 2)?.durationSeconds).toBeNull();
  });

  it('FE-TOUR-SKI-SAVED-002: a tour that does not name its planned legs counts them all only with a kept time and build', () => {
    const unnamed = { ...tour, ski_planned_legs: null };
    expect(savedSkiRoute(unnamed, line, 2)?.plannedLegs).toEqual([0, 1]);
    expect(savedSkiRoute({ ...unnamed, duration: null }, line, 2)?.plannedLegs).toEqual([]);
    expect(savedSkiRoute({ ...unnamed, ski_route_build: null }, line, 2)?.plannedLegs).toEqual([]);
  });

  it('FE-TOUR-SKI-SAVED-003: nothing to open with: another type, no discipline or length, no line, a broken one, another save', () => {
    const json = JSON.stringify(line);
    expect(savedSkiRoute({ ...tour, tour_type: 'hike' }, json, 2)).toBeNull();
    expect(savedSkiRoute({ ...tour, ski_discipline: null }, json, 2)).toBeNull();
    expect(savedSkiRoute({ ...tour, distance: null }, json, 2)).toBeNull();
    expect(savedSkiRoute(tour, null, 2)).toBeNull();
    expect(savedSkiRoute(tour, '[[47, 11', 2)).toBeNull();
    expect(savedSkiRoute(tour, JSON.stringify({ line }), 2)).toBeNull();
    expect(savedSkiRoute(tour, JSON.stringify([line[0]]), 2)).toBeNull();
    expect(savedSkiRoute(tour, JSON.stringify([line[0], [47.01, 11.02]]), 2)).toBeNull();
    expect(savedSkiRoute(tour, JSON.stringify([line[0], 'x']), 2)).toBeNull();
    expect(savedSkiRoute(tour, JSON.stringify([line[0], [47.01, 11.02, null]]), 2)).toBeNull();
    // A line of another length is another save's.
    expect(savedSkiRoute({ ...tour, distance: tour.distance + 0.1 }, json, 2)).toBeNull();
  });

  it('FE-TOUR-SKI-SAVED-004: hands the route on for exactly the points and the ski choice it opens with', () => {
    const points: TourPlannerWaypoint[] = [
      { id: 'a', lat: 47, lng: 11, role: 'start' },
      { id: 'b', lat: 47.01, lng: 11.02, role: 'end' },
    ];
    const choice = { discipline: 'alpine' as const, technique: null };
    const seed = savedSkiSeed(tour, JSON.stringify(line), points, choice);
    expect(seed?.waypointKey).toBe(tourWaypointKey(points));
    expect(seed?.skiKey).toBe(skiRouteKey(choice));
    expect(seed?.route.plannedLegs).toEqual([1]);
    expect(savedSkiSeed({ ...tour, ski_planned_legs: null }, line, points, choice)?.route.plannedLegs).toEqual([0]);
    expect(savedSkiSeed(tour, null, points, choice)).toBeNull();
    expect(savedSkiSeed({ ...tour, ski_planned_legs: null }, line, [], choice)?.route.plannedLegs).toEqual([]);
  });
});
