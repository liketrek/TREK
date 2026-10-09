import {
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  plannedTourDurationMinutesSchema,
  tourCreateRequestSchema,
  tourMaxHikingDifficultySchema,
  tourWebsiteSchema,
} from './tours.schema';

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

describe('Tour planned total duration', () => {
  it('allows an empty value and bounded whole minutes independently of route duration', () => {
    expect(plannedTourDurationMinutesSchema.parse(null)).toBeNull();
    expect(plannedTourDurationMinutesSchema.parse(0)).toBe(0);
    expect(plannedTourDurationMinutesSchema.parse(MAX_PLANNED_TOUR_DURATION_MINUTES)).toBe(
      MAX_PLANNED_TOUR_DURATION_MINUTES,
    );
    expect(
      tourCreateRequestSchema.parse({ ...baseRequest, duration_seconds: 1800, planned_duration_minutes: 95 }),
    ).toMatchObject({
      duration_seconds: 1800,
      planned_duration_minutes: 95,
    });
    expect(plannedTourDurationMinutesSchema.parse(0)).toBe(0);
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: 35 })).toMatchObject({
      break_additional_minutes: 35,
    });
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: 0 })).toMatchObject({
      break_additional_minutes: 0,
    });
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: null })).toMatchObject({
      break_additional_minutes: null,
    });
  });

  it.each([-1, 1441, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid planned minutes %s', (value) => {
    expect(() => plannedTourDurationMinutesSchema.parse(value)).toThrow();
  });
  it('rejects automatic walking plus breaks beyond one day but accepts an explicit bounded override', () => {
    expect(() =>
      tourCreateRequestSchema.parse({
        ...baseRequest,
        duration_seconds: 1430 * 60,
        break_additional_minutes: 11,
      }),
    ).toThrow();
    expect(
      tourCreateRequestSchema.parse({
        ...baseRequest,
        duration_seconds: 1430 * 60,
        break_additional_minutes: 11,
        planned_duration_minutes: 1200,
      }),
    ).toMatchObject({ planned_duration_minutes: 1200 });
  });

  it.each([-1, 1.5, 1441, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid breaks %s', (value) => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: value })).toThrow();
  });
});

describe('Tour informational website', () => {
  it('accepts and normalizes a credential-free HTTPS URL', () => {
    expect(tourWebsiteSchema.parse('  HTTPS://WWW.KOMOOT.COM/tour/42  ')).toBe('https://www.komoot.com/tour/42');
  });

  it.each([
    'http://komoot.com/tour/42',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///tmp/route.gpx',
    'not a url',
    'https://user:password@komoot.com/tour/42',
    'https://user@komoot.com/tour/42',
  ])('rejects unsafe or malformed website %s', (value) => {
    expect(() => tourWebsiteSchema.parse(value)).toThrow();
  });

  it('carries description and website in a Tour create request without making them facet fields', () => {
    const parsed = tourCreateRequestSchema.parse({
      ...baseRequest,
      description: '  A quiet ridge walk  ',
      website: 'https://alltrails.com/trail/42',
    });
    expect(parsed).toMatchObject({
      description: 'A quiet ridge walk',
      website: 'https://alltrails.com/trail/42',
    });
    expect(parsed).not.toHaveProperty('source_url');
    expect(parsed).not.toHaveProperty('source_ref');
  });

  it.each([-1, 1.5, 1441, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid breaks %s', (value) => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: value })).toThrow();
  });
});
