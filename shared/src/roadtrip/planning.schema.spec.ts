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
  it('bounds GPX input and defaults all supported import types', () => {
    expect(roadtripGpxImportSchema.parse({ tripId: 1, gpx: '<gpx/>' })).toMatchObject({
      importTracks: true,
      importRoutes: true,
      importWaypoints: true,
    });
    expect(roadtripGpxImportSchema.safeParse({ tripId: 1, gpx: 'x'.repeat(1000001) }).success).toBe(false);
  });
});
