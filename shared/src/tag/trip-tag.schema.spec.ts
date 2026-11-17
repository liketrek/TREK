import {
  TRIP_TAG_NAME_MAX,
  tripTagCreateRequestSchema,
  tripTagListResponseSchema,
  tripTagResponseSchema,
  tripTagUpdateRequestSchema,
} from './trip-tag.schema';

import { describe, it, expect } from 'vitest';

const tag = { id: 4, user_id: 1, trip_id: 9, name: 'Monument', color: '#10b981', created_at: '2026-11-16 09:44:00' };

describe('tripTagCreateRequestSchema', () => {
  it('trims the name and takes it without a colour', () => {
    expect(tripTagCreateRequestSchema.parse({ name: '  Monument ' })).toEqual({ name: 'Monument' });
  });

  it('refuses a name that is empty once trimmed, or longer than the limit', () => {
    expect(tripTagCreateRequestSchema.safeParse({}).success).toBe(false);
    expect(tripTagCreateRequestSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(tripTagCreateRequestSchema.safeParse({ name: 'x'.repeat(TRIP_TAG_NAME_MAX) }).success).toBe(true);
    expect(tripTagCreateRequestSchema.safeParse({ name: 'x'.repeat(TRIP_TAG_NAME_MAX + 1) }).success).toBe(false);
  });

  it('takes a hex colour and nothing else as one', () => {
    expect(tripTagCreateRequestSchema.safeParse({ name: 'Zone', color: '#0ea5e9' }).success).toBe(true);
    expect(tripTagCreateRequestSchema.safeParse({ name: 'Zone', color: '#abc' }).success).toBe(true);
    expect(tripTagCreateRequestSchema.safeParse({ name: 'Zone', color: 'red' }).success).toBe(false);
    expect(tripTagCreateRequestSchema.safeParse({ name: 'Zone', color: 'url(x)' }).success).toBe(false);
  });

  it('drops keys the contract does not name', () => {
    expect(tripTagCreateRequestSchema.parse({ name: 'Zone', trip_id: 3, user_id: 7 })).toEqual({ name: 'Zone' });
  });
});

describe('tripTagUpdateRequestSchema', () => {
  it('allows either field to be left out', () => {
    expect(tripTagUpdateRequestSchema.parse({})).toEqual({});
    expect(tripTagUpdateRequestSchema.parse({ color: '#f59e0b' })).toEqual({ color: '#f59e0b' });
    expect(tripTagUpdateRequestSchema.parse({ name: ' Activity ' })).toEqual({ name: 'Activity' });
  });

  it('refuses an empty name and a colour that is not hex', () => {
    expect(tripTagUpdateRequestSchema.safeParse({ name: '' }).success).toBe(false);
    expect(tripTagUpdateRequestSchema.safeParse({ color: 'green' }).success).toBe(false);
  });
});

describe('the trip tag responses', () => {
  it('describe a tag row with its trip', () => {
    expect(tripTagResponseSchema.safeParse({ tag }).success).toBe(true);
    expect(tripTagListResponseSchema.safeParse({ tags: [tag, { ...tag, id: 5, name: 'Zone' }] }).success).toBe(true);
  });

  it('fail on a row without a name', () => {
    expect(tripTagResponseSchema.safeParse({ tag: { id: 4, user_id: 1, trip_id: 9, color: '#10b981' } }).success).toBe(
      false,
    );
  });
});
