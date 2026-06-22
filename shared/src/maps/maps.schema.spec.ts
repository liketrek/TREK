import {
  mapsDirectionsPreviewRequestSchema,
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

describe('mapsDirectionsPreviewRequestSchema', () => {
  const location = { label: 'University of Waterloo', lat: 43.4722854, lng: -80.5448576 };

  it('accepts a basic directions preview request with route options', () => {
    expect(
      mapsDirectionsPreviewRequestSchema.safeParse({
        origin: location,
        destination: { label: 'Royal Ontario Museum', lat: 43.6677097, lng: -79.3947771 },
        mode: 'transit',
        avoidTolls: true,
        avoidHighways: false,
        avoidFerries: true,
        time: { kind: 'departAtLocal', localDateTime: '2026-06-21T19:30', timeZone: 'America/Toronto' },
        includeOverviewGeometry: true,
      }).success,
    ).toBe(true);
  });

  it('rejects unsupported modes and too many waypoints', () => {
    expect(
      mapsDirectionsPreviewRequestSchema.safeParse({
        origin: location,
        destination: location,
        mode: 'flying',
      }).success,
    ).toBe(false);
    expect(
      mapsDirectionsPreviewRequestSchema.safeParse({
        origin: location,
        destination: location,
        avoidTolls: 1,
      }).success,
    ).toBe(false);
    expect(
      mapsDirectionsPreviewRequestSchema.safeParse({
        origin: location,
        destination: location,
        waypoints: Array.from({ length: 9 }, () => location),
      }).success,
    ).toBe(false);
  });
});
