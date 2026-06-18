import {
  vacayAddHolidayCalendarRequestSchema,
  vacayInviteRequestSchema,
  vacayToggleEntryRequestSchema,
  vacayAddYearRequestSchema,
} from './vacay.schema';

import { describe, it, expect } from 'vitest';

describe('vacayAddHolidayCalendarRequestSchema', () => {
  it('requires a region; label/color/sort_order optional', () => {
    expect(vacayAddHolidayCalendarRequestSchema.safeParse({ region: 'DE-BY' }).success).toBe(true);
    expect(
      vacayAddHolidayCalendarRequestSchema.safeParse({
        region: 'DE-BY',
        label: null,
      }).success,
    ).toBe(true);
    expect(vacayAddHolidayCalendarRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayInviteRequestSchema', () => {
  it('accepts a numeric or string user_id', () => {
    expect(vacayInviteRequestSchema.safeParse({ user_id: 2 }).success).toBe(true);
    expect(vacayInviteRequestSchema.safeParse({ user_id: '2' }).success).toBe(true);
    expect(vacayInviteRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayToggleEntryRequestSchema', () => {
  it('requires a date; target_user_id optional', () => {
    expect(vacayToggleEntryRequestSchema.safeParse({ date: '2026-07-01' }).success).toBe(true);
    expect(
      vacayToggleEntryRequestSchema.safeParse({
        date: '2026-07-01',
        target_user_id: 3,
      }).success,
    ).toBe(true);
    expect(vacayToggleEntryRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayAddYearRequestSchema', () => {
  it('accepts a numeric or string year', () => {
    expect(vacayAddYearRequestSchema.safeParse({ year: 2027 }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({ year: '2027' }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({}).success).toBe(false);
  });
});
