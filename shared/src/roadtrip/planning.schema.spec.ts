import { MAX_TRIP_DAYS } from '../trip/trip.schema';
import { roadtripDayBoundarySchema } from './day-boundary.schema';
import { roadtripPlanRequestSchema, roadtripCorridorRequestSchema, roadtripGpxImportSchema } from './planning.schema';
import { roadtripPreferencesUpdateSchema } from './preferences.schema';

import { describe, expect, it } from 'vitest';

describe('Roadtrip MCP contracts', () => {
  it('defaults to a compact read-only calculation', () => {
    expect(roadtripPlanRequestSchema.parse({ tripId: 3 })).toEqual({ tripId: 3, includeGeometry: false });
    expect(roadtripPlanRequestSchema.safeParse({ tripId: -1 }).success).toBe(false);
  });
  it.each([
    { roadtrip_day_start: '24:00' },
    { roadtrip_fill_percent: 101 },
    { routing_base_url: 'http://localhost' },
    {},
    { roadtrip_range_km: -1 },
    { roadtrip_avoid: 'unknown' },
  ])('rejects invalid driving preferences %j', (settings) => {
    expect(roadtripPreferencesUpdateSchema.safeParse(settings).success).toBe(false);
  });
  it('takes the switch that starts and ends each day at the stay as a boolean, and nothing else', () => {
    expect(roadtripPreferencesUpdateSchema.parse({ roadtrip_hotel_bookends: true })).toEqual({
      roadtrip_hotel_bookends: true,
    });
    expect(roadtripPreferencesUpdateSchema.parse({ roadtrip_hotel_bookends: false })).toEqual({
      roadtrip_hotel_bookends: false,
    });
    for (const value of ['true', 1, null, 'on']) {
      expect(roadtripPreferencesUpdateSchema.safeParse({ roadtrip_hotel_bookends: value }).success).toBe(false);
    }
  });
  it('allows clearing settings and preserves manual controls', () => {
    expect(
      roadtripPreferencesUpdateSchema.parse({
        roadtrip_day_start: '',
        roadtrip_range_km: 0,
        roadtrip_day_end_mode: 'stop',
      }),
    ).toMatchObject({ roadtrip_day_start: '' });
  });
  it('bounds corridor queries', () => {
    expect(roadtripCorridorRequestSchema.parse({ tripId: 1, dayNumber: 1, category: 'charging' })).toMatchObject({
      offset: 0,
      widthKm: 5,
    });
    expect(
      roadtripCorridorRequestSchema.safeParse({ tripId: 1, dayNumber: 1, category: 'charging', widthKm: 500 }).success,
    ).toBe(false);
  });
  it('lets day numbers run to the trip limit, not to a year (#2403)', () => {
    const corridor = (dayNumber: number) =>
      roadtripCorridorRequestSchema.safeParse({ tripId: 1, dayNumber, category: 'fuel' });
    expect(corridor(400).success).toBe(true);
    expect(corridor(MAX_TRIP_DAYS).success).toBe(true);
    expect(corridor(MAX_TRIP_DAYS + 1).success).toBe(false);
    const boundary = (day_number: number) =>
      roadtripDayBoundarySchema.safeParse({ day_number, from_assignment_id: 1, to_assignment_id: 2, fraction: 0.5 });
    expect(boundary(400).success).toBe(true);
    expect(boundary(MAX_TRIP_DAYS).success).toBe(true);
    expect(boundary(MAX_TRIP_DAYS + 1).success).toBe(false);
  });
  it('bounds GPX input and defaults all supported import types', () => {
    expect(roadtripGpxImportSchema.parse({ tripId: 1, gpx: '<gpx/>' })).toMatchObject({
      importTracks: true,
      importRoutes: true,
      importWaypoints: true,
    });
    expect(roadtripGpxImportSchema.safeParse({ tripId: 1, gpx: 'x'.repeat(1000001) }).success).toBe(false);
  });
});
