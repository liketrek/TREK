import {
  placeCreateRequestSchema,
  placeBulkDeleteRequestSchema,
  placeImportListRequestSchema,
  placeSchema,
} from './place.schema';

import { describe, it, expect } from 'vitest';

describe('placeSchema route_color (#776)', () => {
  const place = { id: 1, trip_id: 1, name: 'Walk' };

  it('takes a hex colour, null, or nothing at all', () => {
    expect(placeSchema.safeParse({ ...place, route_color: '#e11d48' }).success).toBe(true);
    expect(placeSchema.safeParse({ ...place, route_color: '#abc' }).success).toBe(true);
    // null is how a track goes back to inheriting its category colour.
    expect(placeSchema.safeParse({ ...place, route_color: null }).success).toBe(true);
    expect(placeSchema.safeParse(place).success).toBe(true);
  });

  it('rejects anything a map renderer could not parse', () => {
    expect(placeSchema.safeParse({ ...place, route_color: 'blue' }).success).toBe(false);
    expect(placeSchema.safeParse({ ...place, route_color: '#12345' }).success).toBe(false);
    expect(placeSchema.safeParse({ ...place, route_color: 'e11d48' }).success).toBe(false);
  });
});

describe('placeCreateRequestSchema', () => {
  it('requires a name and keeps the other place fields open', () => {
    expect(
      placeCreateRequestSchema.safeParse({
        name: 'Spot',
        lat: 1,
        lng: 2,
        anything: true,
      }).success,
    ).toBe(true);
    expect(placeCreateRequestSchema.safeParse({ lat: 1 }).success).toBe(false);
  });
});

describe('placeBulkDeleteRequestSchema', () => {
  it('requires a numeric ids array', () => {
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: [1, 2] }).success).toBe(true);
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: ['a'] }).success).toBe(false);
  });
});

describe('placeImportListRequestSchema', () => {
  it('requires a non-empty url', () => {
    expect(placeImportListRequestSchema.safeParse({ url: 'http://x' }).success).toBe(true);
    expect(placeImportListRequestSchema.safeParse({ url: '' }).success).toBe(false);
  });
});
