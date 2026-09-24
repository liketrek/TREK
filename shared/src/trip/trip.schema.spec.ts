import {
  MAX_TRIP_DAYS,
  tripSpanDays,
  tripCreateRequestSchema,
  tripUpdateRequestSchema,
  tripAddMemberRequestSchema,
  activeTripResponseSchema,
} from './trip.schema';

import { describe, it, expect } from 'vitest';

describe('tripCreateRequestSchema', () => {
  it('requires a title; dates/currency/reminder optional', () => {
    expect(tripCreateRequestSchema.safeParse({ title: 'Japan' }).success).toBe(true);
    expect(
      tripCreateRequestSchema.safeParse({
        title: 'Japan',
        start_date: '2026-07-01',
        day_count: 7,
      }).success,
    ).toBe(true);
    expect(tripCreateRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('MAX_TRIP_DAYS', () => {
  it('lets a trip run past a year and keeps day numbers to three digits (#2403)', () => {
    expect(MAX_TRIP_DAYS).toBeGreaterThan(366);
    expect(MAX_TRIP_DAYS).toBeLessThan(1000);
  });
});

describe('tripSpanDays', () => {
  it('counts both ends, across a leap day and a year boundary', () => {
    expect(tripSpanDays('2026-07-01', '2026-07-01')).toBe(1);
    expect(tripSpanDays('2026-07-01', '2026-07-07')).toBe(7);
    expect(tripSpanDays('2024-02-28', '2024-03-01')).toBe(3);
    expect(tripSpanDays('2025-01-26', '2026-01-28')).toBe(368);
  });

  it('goes below one when the end precedes the start', () => {
    expect(tripSpanDays('2026-07-07', '2026-07-01')).toBe(-5);
  });
});

describe('tripUpdateRequestSchema', () => {
  it('is fully partial and accepts is_archived + cover_image', () => {
    expect(tripUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(tripUpdateRequestSchema.safeParse({ is_archived: 1, cover_image: null }).success).toBe(true);
  });
});

describe('tripAddMemberRequestSchema', () => {
  it('requires an identifier', () => {
    expect(tripAddMemberRequestSchema.safeParse({ identifier: 'bob@x.y' }).success).toBe(true);
    expect(tripAddMemberRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('activeTripResponseSchema', () => {
  it('accepts a trip with or without dates, and an explicit null', () => {
    expect(activeTripResponseSchema.safeParse({ trip: { id: 1, title: 'Japan' } }).success).toBe(true);
    expect(
      activeTripResponseSchema.safeParse({ trip: { id: 1, title: 'Japan', start_date: null, end_date: null } }).success,
    ).toBe(true);
    expect(activeTripResponseSchema.safeParse({ trip: null }).success).toBe(true);
  });

  it('rejects a missing trip key — "no trip" is null, not absent', () => {
    expect(activeTripResponseSchema.safeParse({}).success).toBe(false);
    expect(activeTripResponseSchema.safeParse({ trip: { title: 'Japan' } }).success).toBe(false);
  });
});
