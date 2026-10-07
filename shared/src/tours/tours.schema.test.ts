import { tourCreateRequestSchema, tourMaxHikingDifficultySchema } from './tours.schema';

import { describe, expect, it } from 'vitest';

const baseRequest = {
  name: 'Ridge walk',
  route_geometry: [
    [48, 11, 600],
    [48.01, 11.02, 650],
  ],
  waypoints: [
    { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
    { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
  ],
};

describe('Tours maximum hiking difficulty', () => {
  it('defaults create requests to T2', () => {
    expect(tourCreateRequestSchema.parse(baseRequest).max_hiking_difficulty).toBe(2);
  });

  it('accepts only integer values from T1 through T6', () => {
    for (const value of [1, 2, 3, 4, 5, 6]) {
      expect(tourMaxHikingDifficultySchema.parse(value)).toBe(value);
    }
    for (const value of [0, -1, 7, 1.5, '2', null]) {
      expect(() => tourMaxHikingDifficultySchema.parse(value)).toThrow();
    }
  });
});
