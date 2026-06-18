import {
  mapsSearchRequestSchema,
  mapsAutocompleteRequestSchema,
  mapsReverseQuerySchema,
  mapsResolveUrlRequestSchema,
} from './maps.schema';

import { describe, it, expect } from 'vitest';

describe('mapsSearchRequestSchema', () => {
  it('requires a non-empty query', () => {
    expect(mapsSearchRequestSchema.safeParse({ query: 'berlin' }).success).toBe(true);
    expect(mapsSearchRequestSchema.safeParse({ query: '' }).success).toBe(false);
    expect(mapsSearchRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('mapsAutocompleteRequestSchema', () => {
  it('caps input at 200 chars and allows an optional locationBias', () => {
    expect(mapsAutocompleteRequestSchema.safeParse({ input: 'be' }).success).toBe(true);
    expect(mapsAutocompleteRequestSchema.safeParse({ input: 'x'.repeat(201) }).success).toBe(false);
    expect(
      mapsAutocompleteRequestSchema.safeParse({
        input: 'be',
        locationBias: { low: { lat: 1, lng: 2 }, high: { lat: 3, lng: 4 } },
      }).success,
    ).toBe(true);
  });
});

describe('mapsReverseQuerySchema', () => {
  it('requires lat and lng as strings (the route parses them downstream)', () => {
    expect(mapsReverseQuerySchema.safeParse({ lat: '52.5', lng: '13.4' }).success).toBe(true);
    expect(mapsReverseQuerySchema.safeParse({ lat: '52.5' }).success).toBe(false);
  });
});

describe('mapsResolveUrlRequestSchema', () => {
  it('requires a non-empty url', () => {
    expect(
      mapsResolveUrlRequestSchema.safeParse({
        url: 'https://maps.app.goo.gl/x',
      }).success,
    ).toBe(true);
    expect(mapsResolveUrlRequestSchema.safeParse({ url: '' }).success).toBe(false);
  });
});
