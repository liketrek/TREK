// FE-TOUR-ROUTEAPPS-001 to FE-TOUR-ROUTEAPPS-004
import { describe, expect, it } from 'vitest';

import { TOUR_APP_MAX_STOPS, tourAppProfile, tourRouteStops, tourRouteTargets } from './tourRouteApps';

/** A straight line east along the equator, one point every 0.01 degrees. */
const line = (points: number): [number, number][] => Array.from({ length: points }, (_, i) => [0, i / 100]);

describe('tourRouteApps (#2812)', () => {
  it('FE-TOUR-ROUTEAPPS-001: a short line goes whole, the start named by the tour', () => {
    expect(tourRouteStops(line(3), 'Ridge walk')).toEqual([
      { lat: 0, lng: 0, name: 'Ridge walk' },
      { lat: 0, lng: 0.01 },
      { lat: 0, lng: 0.02 },
    ]);
  });

  it('FE-TOUR-ROUTEAPPS-002: a long line is thinned to the cap, evenly along it, keeping both ends', () => {
    const stops = tourRouteStops(line(101), 'Long ride');
    expect(stops).toHaveLength(TOUR_APP_MAX_STOPS);
    expect(stops[0]).toEqual({ lat: 0, lng: 0, name: 'Long ride' });
    expect(stops[stops.length - 1]).toEqual({ lat: 0, lng: 1 });
    // Nine equal steps over a hundred points: every eleventh point, give or take one.
    const steps = stops.slice(1).map((stop, i) => Math.round((stop.lng - stops[i].lng) * 100));
    expect(steps.every((step) => step === 11 || step === 12)).toBe(true);
  });

  it('FE-TOUR-ROUTEAPPS-003: walks and hikes are walked, bike tours ridden, and the rest offered to no app', () => {
    expect(tourAppProfile('hike')).toBe('walking');
    expect(tourAppProfile('walk')).toBe('walking');
    expect(tourAppProfile('bike')).toBe('cycling');
    expect(tourAppProfile('kayak')).toBeNull();
    expect(tourAppProfile('ski')).toBeNull();
    expect(tourAppProfile('horse')).toBeNull();
    expect(tourRouteTargets('kayak', line(5), 'Lake')).toEqual([]);
  });

  it('FE-TOUR-ROUTEAPPS-004: only the apps that take the whole route, with the mode the tour is routed in', () => {
    const targets = tourRouteTargets('bike', line(2), 'Ride');
    expect(targets.map((target) => target.id)).toEqual(['google', 'comaps']);
    expect(targets.find((target) => target.id === 'comaps')?.url).toContain('type=bicycle');
    expect(targets.find((target) => target.id === 'google')?.url).toBe('https://www.google.com/maps/dir/0,0/0,0.01');
  });
});
