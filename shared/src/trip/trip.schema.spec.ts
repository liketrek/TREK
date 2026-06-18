import { tripCreateRequestSchema, tripUpdateRequestSchema, tripAddMemberRequestSchema } from './trip.schema';

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
