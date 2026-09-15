import { roadtripSearchAreaSchema } from './search.schema';

import { describe, expect, it } from 'vitest';

describe('Roadtrip search area', () => {
  const request = { categories: ['fuel'], bbox: { south: 48, north: 49, west: 10, east: 11 } };
  it('validates categories and ordered geographic bounds', () => {
    expect(roadtripSearchAreaSchema.safeParse(request).success).toBe(true);
    expect(roadtripSearchAreaSchema.safeParse({ ...request, categories: ['unknown'] }).success).toBe(false);
    expect(roadtripSearchAreaSchema.safeParse({ ...request, bbox: { ...request.bbox, south: 50 } }).success).toBe(
      false,
    );
  });
});
