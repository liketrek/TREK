import { describe, expect, it } from 'vitest';
import { days, mapsUrl, places, routeUrl, source } from './data';
import roads from './road-routes.json';
describe('NZ source-backed itinerary', () => {
  it('covers each source itinerary day exactly once', () => {
    expect(days.map((d) => `D${d.id}`)).toEqual(source.itinerary.map((d) => d.day));
    expect(new Set(days.map((d) => d.id)).size).toBe(8);
  });
  it('counts only listed road distance, excluding the flight day', () => {
    expect(days.reduce((sum, d) => sum + d.km, 0)).toBe(1276);
    expect(days.find((d) => d.id === 8)).toMatchObject({ mode: 'flight', km: 0 });
    expect(days.find((d) => d.id === 9)?.km).toBe(286);
  });
  it('keeps every map coordinate in the South Island', () => {
    for (const day of days)
      for (const { place } of day.stops) {
        expect(place.position[0]).toBeGreaterThan(-47);
        expect(place.position[0]).toBeLessThan(-41);
        expect(place.position[1]).toBeGreaterThan(166);
        expect(place.position[1]).toBeLessThan(175);
      }
  });
  it('creates encoded navigation links with all intermediate stops', () => {
    const url = new URL(routeUrl(days[1]));
    expect(url.searchParams.get('origin')).toContain('Lake Tekapo');
    expect(url.searchParams.get('destination')).toContain('Wānaka');
    expect(url.searchParams.get('waypoints')).toContain('Mount Cook');
    expect(new URL(mapsUrl(places.church)).searchParams.get('query')).toContain('Church of the Good Shepherd');
  });
  it('retains 8 accommodation nights and marks uncertain activity locations', () => {
    expect(source.stays.filter((s) => s.city !== '飞机')).toHaveLength(8);
    for (const k of ['stars', 'cook', 'guns', 'skydive'] as const) expect(places[k].approximate).toBe(true);
  });
  it('caches road geometry only for driving days', () => {
    expect(Object.keys(roads)).toEqual(['3', '4', '5', '6', '9', '10']);
    for (const road of Object.values(roads)) {
      expect(road.positions.length).toBeGreaterThan(10);
      for (const [lat, lng] of road.positions) {
        expect(lat).toBeGreaterThan(-47);
        expect(lat).toBeLessThan(-41);
        expect(lng).toBeGreaterThan(166);
        expect(lng).toBeLessThan(175);
      }
    }
  });
});
