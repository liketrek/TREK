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
    expect(() => tourGpxImportFieldsSchema.parse({ tour_type: 'food' })).toThrow();
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

describe('Tours KML preview (IO-02)', () => {
  const track = {
    name: 'Ridge (1/2)',
    geometry: [
      [47, 11],
      [47.01, 11.01],
    ],
    point_count: 2,
    distance_km: 1.4,
    elevation_gain_m: null,
    elevation_loss_m: null,
    duplicate: false,
  };

  it('counts what a KML file held besides its lines, and a GPX preview may leave that out', () => {
    const kml = { tracks: [track], left_out: { points: 3, areas: 1, other: 0 } };
    expect(tourGpxPreviewResponseSchema.parse(kml)).toEqual(kml);
    expect(tourGpxPreviewResponseSchema.parse({ tracks: [track] })).toEqual({ tracks: [track] });
  });

  it('refuses a count that is negative or not whole', () => {
    for (const left_out of [
      { points: -1, areas: 0, other: 0 },
      { points: 0, areas: 0.5, other: 0 },
      { points: 0, areas: 0 },
    ]) {
      expect(tourGpxPreviewResponseSchema.safeParse({ tracks: [track], left_out }).success).toBe(false);
    }
  });
});
