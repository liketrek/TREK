import { chargingLookupSchema } from './charging.schema';

import { describe, expect, it } from 'vitest';

describe('Charging station lookup by coordinate', () => {
  const request = { lat: 48.137, lng: 11.575, name: 'Ladepark Nord' };
  it('accepts a bounded coordinate and a nameless station', () => {
    expect(chargingLookupSchema.safeParse(request).success).toBe(true);
    // OSM charging nodes are regularly untagged; the matcher has its own answer for
    // that case, so an empty name must reach it rather than being refused here.
    expect(chargingLookupSchema.safeParse({ ...request, name: '' }).success).toBe(true);
  });
  it('refuses coordinates off the globe and an unbounded name', () => {
    expect(chargingLookupSchema.safeParse({ ...request, lat: 91 }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, lng: -181 }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, lat: Number.NaN }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, name: 'x'.repeat(201) }).success).toBe(false);
  });
  it('has no batch form: the array a caller might send is not a station', () => {
    // The cache key upstream is one station, and a cache miss costs several requests
    // against a shared public registry. Anything list-shaped is refused outright.
    expect(chargingLookupSchema.safeParse([request]).success).toBe(false);
  });
});
