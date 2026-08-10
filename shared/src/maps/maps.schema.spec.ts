import {
  mapsSearchRequestSchema,
  mapsAutocompleteRequestSchema,
  mapsReverseQuerySchema,
  mapsResolveUrlRequestSchema,
  mapsPlaceEnrichmentRequestSchema,
  mapsPlaceEnrichmentResultSchema,
  placePhotoCandidateSchema,
  placeDescriptionSchema,
} from './maps.schema';

import { describe, it, expect } from 'vitest';

describe('mapsSearchRequestSchema', () => {
  it('requires a non-empty query', () => {
    expect(mapsSearchRequestSchema.safeParse({ query: 'berlin' }).success).toBe(true);
    expect(mapsSearchRequestSchema.safeParse({ query: '' }).success).toBe(false);
    expect(mapsSearchRequestSchema.safeParse({}).success).toBe(false);
  });

  it('allows an optional circle locationBias with numeric lat/lng and optional radius', () => {
    expect(
      mapsSearchRequestSchema.safeParse({ query: 'berlin', locationBias: { lat: 52.5, lng: 13.4 } }).success,
    ).toBe(true);
    expect(
      mapsSearchRequestSchema.safeParse({ query: 'berlin', locationBias: { lat: 52.5, lng: 13.4, radius: 50000 } })
        .success,
    ).toBe(true);
    // NaN arrives as null over JSON; either way a non-numeric lat must fail.
    expect(
      mapsSearchRequestSchema.safeParse({ query: 'berlin', locationBias: { lat: null, lng: 13.4 } }).success,
    ).toBe(false);
    expect(mapsSearchRequestSchema.safeParse({ query: 'berlin', locationBias: { lat: 52.5 } }).success).toBe(false);
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

describe('mapsPlaceEnrichmentRequestSchema', () => {
  const base = { lat: 52.5, lng: 13.4, name: 'Museum Ludwig' };

  it('needs coordinates and a name, but not a place id', () => {
    expect(mapsPlaceEnrichmentRequestSchema.safeParse(base).success).toBe(true);
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, placeId: 'ChIJx' }).success).toBe(true);
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ lat: 52.5, lng: 13.4 }).success).toBe(false);
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });

  it('rejects coordinates that arrived as strings or null', () => {
    // The client reads these off a provider blob, where lat can be a string.
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, lat: '52.5' }).success).toBe(false);
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, lng: null }).success).toBe(false);
  });

  it('caps the free-text fields so a pasted blob cannot reach the providers', () => {
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, name: 'x'.repeat(301) }).success).toBe(false);
    expect(mapsPlaceEnrichmentRequestSchema.safeParse({ ...base, placeId: 'x'.repeat(301) }).success).toBe(false);
  });
});

describe('placePhotoCandidateSchema', () => {
  const candidate = {
    key: 'ChIJx~p0',
    url: '/api/maps/place-photo/ChIJx~p0/bytes',
    attribution: 'Jane Doe',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
    source: 'wikimedia',
  };

  it('accepts a fully attributed candidate', () => {
    expect(placePhotoCandidateSchema.safeParse(candidate).success).toBe(true);
  });

  it('allows every licence field to be null, because Google supplies none of them', () => {
    expect(
      placePhotoCandidateSchema.safeParse({
        ...candidate,
        source: 'google',
        attribution: null,
        license: null,
        licenseUrl: null,
        sourceUrl: null,
      }).success,
    ).toBe(true);
  });

  it('requires the fields to be present even when null, so the column cannot silently skip attribution', () => {
    const { attribution, ...withoutAttribution } = candidate;
    void attribution;
    expect(placePhotoCandidateSchema.safeParse(withoutAttribution).success).toBe(false);
  });

  it('rejects an unknown source', () => {
    expect(placePhotoCandidateSchema.safeParse({ ...candidate, source: 'unsplash' }).success).toBe(false);
  });
});

describe('placeDescriptionSchema', () => {
  it('keeps the source alongside the text', () => {
    expect(
      placeDescriptionSchema.safeParse({
        text: 'A museum in Cologne.',
        source: 'wikipedia',
        sourceUrl: 'https://de.wikipedia.org/wiki/Museum_Ludwig',
        license: 'CC BY-SA 4.0',
      }).success,
    ).toBe(true);
    expect(placeDescriptionSchema.safeParse({ text: 'A museum.' }).success).toBe(false);
  });
});

describe('mapsPlaceEnrichmentResultSchema', () => {
  it('accepts an empty result, which is what a keyless instance with no Commons hit returns', () => {
    expect(mapsPlaceEnrichmentResultSchema.safeParse({ photos: [], description: null, facts: [] }).success).toBe(true);
  });

  it('treats hours and rating as additive, so an older payload still parses', () => {
    // They arrived after the first release of this endpoint; a cached result
    // written before that has neither and must stay valid.
    expect(mapsPlaceEnrichmentResultSchema.safeParse({ photos: [], description: null, facts: [] }).success).toBe(true);
    expect(
      mapsPlaceEnrichmentResultSchema.safeParse({
        photos: [],
        description: null,
        facts: [],
        hours: { weekdayDescriptions: ['Monday: 09:00-18:00'], periods: null, specialDays: null },
        rating: { value: 4.5, count: 1234 },
      }).success,
    ).toBe(true);
    // A place that never closes has a period with no close time.
    expect(
      mapsPlaceEnrichmentResultSchema.safeParse({
        photos: [],
        description: null,
        facts: [],
        hours: {
          weekdayDescriptions: ['Monday: 00:00-24:00'],
          periods: [{ open: { day: 0, hour: 0, minute: 0 }, close: null }],
        },
      }).success,
    ).toBe(true);
    // Google's search results carry a rating but no count.
    expect(
      mapsPlaceEnrichmentResultSchema.safeParse({ photos: [], description: null, facts: [], rating: { value: 4, count: null } })
        .success,
    ).toBe(true);
  });

  it('accepts the kill-switch response', () => {
    expect(
      mapsPlaceEnrichmentResultSchema.safeParse({ photos: [], description: null, facts: [], disabled: true }).success,
    ).toBe(true);
  });

  it('requires description to be explicitly null rather than absent', () => {
    expect(mapsPlaceEnrichmentResultSchema.safeParse({ photos: [] }).success).toBe(false);
  });
});
