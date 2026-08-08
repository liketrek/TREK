import {
  markRegionRequestSchema,
  createBucketItemRequestSchema,
  regionGeoSchema,
  visitStatusSchema,
  todayUtc,
  tripVisitStatus,
  VISIT_STATUS_RANK,
  strongerVisitStatus,
} from './atlas.schema';

import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * The date helpers below read the wall clock, so every test that exercises the
 * default `today` pins it first — otherwise the suite flips its answers when it
 * happens to run across midnight UTC.
 */
function freezeClock(iso: string): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

afterEach(() => {
  vi.useRealTimers();
});

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

describe('visitStatusSchema', () => {
  it('accepts the three buckets and nothing else', () => {
    expect(visitStatusSchema.safeParse('visited').success).toBe(true);
    expect(visitStatusSchema.safeParse('planned').success).toBe(true);
    expect(visitStatusSchema.safeParse('idea').success).toBe(true);
    expect(visitStatusSchema.safeParse('wishlist').success).toBe(false);
    expect(visitStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('tripVisitStatus', () => {
  // Passed explicitly wherever the clock is not the thing under test.
  const TODAY = '2026-08-03';

  it('counts a trip that already ended as visited', () => {
    expect(tripVisitStatus('2026-01-10', '2026-01-20', TODAY)).toBe('visited');
  });

  it('counts a running trip as visited — you are there right now', () => {
    expect(tripVisitStatus('2026-08-01', '2026-08-10', TODAY)).toBe('visited');
  });

  it('counts a trip that has not started yet as planned', () => {
    expect(tripVisitStatus('2026-09-01', '2026-09-10', TODAY)).toBe('planned');
  });

  it('flips to visited on the start day itself', () => {
    expect(tripVisitStatus(TODAY, '2026-08-09', TODAY)).toBe('visited');
    expect(tripVisitStatus(TODAY, TODAY, TODAY)).toBe('visited');
    // ...and the very next day is still only planned
    expect(tripVisitStatus('2026-08-04', '2026-08-09', TODAY)).toBe('planned');
  });

  it('works off start_date alone', () => {
    expect(tripVisitStatus('2026-01-10', null, TODAY)).toBe('visited');
    expect(tripVisitStatus('2026-12-01', null, TODAY)).toBe('planned');
  });

  it('falls back to end_date as the effective start', () => {
    expect(tripVisitStatus(null, '2026-01-20', TODAY)).toBe('visited');
    expect(tripVisitStatus(null, '2026-12-20', TODAY)).toBe('planned');
  });

  it('treats a trip without any date as an idea, not a plan', () => {
    expect(tripVisitStatus(null, null, TODAY)).toBe('idea');
  });

  it('treats null, undefined and empty strings alike', () => {
    expect(tripVisitStatus(undefined, undefined, TODAY)).toBe('idea');
    expect(tripVisitStatus(null, undefined, TODAY)).toBe('idea');
    expect(tripVisitStatus(undefined, null, TODAY)).toBe('idea');
    expect(tripVisitStatus('', '', TODAY)).toBe('idea');
    expect(tripVisitStatus(undefined, '2026-01-20', TODAY)).toBe(tripVisitStatus(null, '2026-01-20', TODAY));
    expect(tripVisitStatus('', '2026-01-20', TODAY)).toBe('visited');
  });

  it('defaults to the UTC clock, right up to the last second of the day', () => {
    freezeClock('2026-08-03T23:59:59.999Z');
    expect(tripVisitStatus('2026-08-03', null)).toBe('visited');
    expect(tripVisitStatus('2026-08-04', null)).toBe('planned');
  });
});

describe('strongerVisitStatus', () => {
  it('ranks visited above planned above idea', () => {
    expect(VISIT_STATUS_RANK.visited).toBeLessThan(VISIT_STATUS_RANK.planned);
    expect(VISIT_STATUS_RANK.planned).toBeLessThan(VISIT_STATUS_RANK.idea);
  });

  it('picks the stronger status regardless of argument order', () => {
    expect(strongerVisitStatus('visited', 'planned')).toBe('visited');
    expect(strongerVisitStatus('planned', 'visited')).toBe('visited');
    expect(strongerVisitStatus('visited', 'idea')).toBe('visited');
    expect(strongerVisitStatus('idea', 'visited')).toBe('visited');
    expect(strongerVisitStatus('planned', 'idea')).toBe('planned');
    expect(strongerVisitStatus('idea', 'planned')).toBe('planned');
  });

  it('returns the shared status on a tie', () => {
    expect(strongerVisitStatus('visited', 'visited')).toBe('visited');
    expect(strongerVisitStatus('planned', 'planned')).toBe('planned');
    expect(strongerVisitStatus('idea', 'idea')).toBe('idea');
  });
});

describe('todayUtc', () => {
  it('formats as YYYY-MM-DD', () => {
    freezeClock('2026-08-03T12:00:00.000Z');
    expect(todayUtc()).toBe('2026-08-03');
    expect(todayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('zero-pads single-digit months and days', () => {
    freezeClock('2026-01-05T08:30:00.000Z');
    expect(todayUtc()).toBe('2026-01-05');
  });

  it('does not tip into the next day late in the evening UTC', () => {
    freezeClock('2026-08-03T23:59:59.999Z');
    expect(todayUtc()).toBe('2026-08-03');
  });

  it('rolls over at midnight UTC', () => {
    freezeClock('2026-08-04T00:00:00.000Z');
    expect(todayUtc()).toBe('2026-08-04');
  });
});
