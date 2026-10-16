import { tourGpxImportFieldsSchema, tourGpxPreviewResponseSchema } from './tour-gpx-import.schema';

import { describe, expect, it } from 'vitest';

describe('Tours GPX import fields', () => {
  it('imports as a hike when nothing is chosen, as it always did', () => {
    expect(tourGpxImportFieldsSchema.parse({})).toEqual({ tour_type: 'hike' });
  });

  it('takes a paddle import with its boat and water', () => {
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' })).toEqual({
      tour_type: 'kayak',
      boat_type: 'sup',
      water_context: 'lake',
    });
  });

  it('refuses a paddle import without a boat, and a hike that names one', () => {
    expect(() => tourGpxImportFieldsSchema.parse({ tour_type: 'kayak', water_context: 'lake' })).toThrow(/boat_type/);
    expect(() => tourGpxImportFieldsSchema.parse({ tour_type: 'hike', boat_type: 'sup' })).toThrow(/paddle import/);
    expect(() => tourGpxImportFieldsSchema.parse({ tour_type: 'ski' })).toThrow();
  });
});

describe('Tours GPX preview', () => {
  it('describes a track with and without heights', () => {
    const preview = {
      tracks: [
        {
          name: 'Lake loop',
          geometry: [
            [53, 13],
            [53.01, 13.02],
          ],
          point_count: 2,
          distance_km: 1.8,
          elevation_gain_m: null,
          elevation_loss_m: null,
          duplicate: false,
        },
        {
          name: 'River',
          geometry: [
            [53, 13, 50],
            [53.01, 13.02, 48],
          ],
          point_count: 2,
          distance_km: 1.8,
          elevation_gain_m: 0,
          elevation_loss_m: 2,
          duplicate: true,
        },
      ],
    };
    expect(tourGpxPreviewResponseSchema.parse(preview)).toEqual(preview);
  });
});
