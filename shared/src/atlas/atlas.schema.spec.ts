import { markRegionRequestSchema, createBucketItemRequestSchema, regionGeoSchema } from './atlas.schema';

import { describe, it, expect } from 'vitest';

describe('markRegionRequestSchema', () => {
  it('requires both name and country_code', () => {
    expect(markRegionRequestSchema.safeParse({ name: 'Bavaria', country_code: 'DE' }).success).toBe(true);
    expect(markRegionRequestSchema.safeParse({ name: 'Bavaria' }).success).toBe(false);
  });
});

describe('createBucketItemRequestSchema', () => {
  it('requires a name; coordinates and metadata optional/nullable', () => {
    expect(createBucketItemRequestSchema.safeParse({ name: 'Tokyo' }).success).toBe(true);
    expect(
      createBucketItemRequestSchema.safeParse({
        name: 'Tokyo',
        lat: 35,
        lng: 139,
        country_code: null,
      }).success,
    ).toBe(true);
    expect(createBucketItemRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('regionGeoSchema', () => {
  it('accepts a FeatureCollection with opaque features', () => {
    expect(regionGeoSchema.safeParse({ type: 'FeatureCollection', features: [] }).success).toBe(true);
    expect(
      regionGeoSchema.safeParse({
        type: 'FeatureCollection',
        features: [{ anything: true }],
      }).success,
    ).toBe(true);
    expect(regionGeoSchema.safeParse({ type: 'Other', features: [] }).success).toBe(false);
  });
});
