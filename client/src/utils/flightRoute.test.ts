// FE-UTIL-FLIGHTROUTE-001 to FE-UTIL-FLIGHTROUTE-004
import { describe, expect, it } from 'vitest';
import { bearing, greatCircle, splitRoute } from './flightRoute';

const FRA = { lat: 50.03, lng: 8.57 };
const YYZ = { lat: 43.68, lng: -79.63 };
const NRT = { lat: 35.77, lng: 140.39 };
const SFO = { lat: 37.62, lng: -122.38 };

describe('flightRoute', () => {
  it('FE-UTIL-FLIGHTROUTE-001: runs from end to end and bows towards the pole', () => {
    const route = greatCircle(FRA, YYZ, 32);
    expect(route).toHaveLength(33);
    expect(route[0].lat).toBeCloseTo(FRA.lat, 6);
    expect(route[32].lng).toBeCloseTo(YYZ.lng, 6);
    // Frankfurt to Toronto passes well north of both, over the North Atlantic towards Greenland.
    expect(Math.max(...route.map((p) => p.lat))).toBeGreaterThan(55);
  });

  it('FE-UTIL-FLIGHTROUTE-002: stays one line across the date line', () => {
    const route = greatCircle(NRT, SFO, 32);
    for (let i = 1; i < route.length; i++) expect(Math.abs(route[i].lng - route[i - 1].lng)).toBeLessThan(20);
    // Continued past 180 rather than jumping to -180.
    expect(route[32].lng).toBeCloseTo(SFO.lng + 360, 6);
  });

  it('FE-UTIL-FLIGHTROUTE-003: gives the heading at the start', () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 10, lng: 0 })).toBeCloseTo(0, 6);
    expect(bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 10 })).toBeCloseTo(90, 6);
    // Westbound across the Atlantic leaves Frankfurt heading north west.
    expect(bearing(FRA, YYZ)).toBeGreaterThan(270);
  });

  it('FE-UTIL-FLIGHTROUTE-004: cuts the route where the aircraft is, clamped to its ends', () => {
    const route = greatCircle(FRA, YYZ, 10);
    const half = splitRoute(route, 0.5);
    expect(half.flown.at(-1)).toEqual(half.at);
    expect(half.ahead[0]).toEqual(half.at);
    expect(half.flown.length + half.ahead.length).toBe(route.length + 2);
    expect(splitRoute(route, -1).at).toEqual(route[0]);
    expect(splitRoute(route, 2).at.lng).toBeCloseTo(route[10].lng, 6);
  });
});
