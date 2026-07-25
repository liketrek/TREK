import {
  vacayAddHolidayCalendarRequestSchema,
  vacayInviteRequestSchema,
  vacayToggleEntryRequestSchema,
  vacayAddYearRequestSchema,
  vacayYearSettingsRequestSchema,
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

describe('vacayYearSettingsRequestSchema', () => {
  it('requires a known year type; the month/day/hire_date parts are optional', () => {
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'calendar' }).success).toBe(true);
    expect(
      vacayYearSettingsRequestSchema.safeParse({ year_type: 'fiscal', year_start_month: 7, year_start_day: 1 }).success,
    ).toBe(true);
    expect(
      vacayYearSettingsRequestSchema.safeParse({ year_type: 'anniversary', hire_date: '2019-09-16' }).success,
    ).toBe(true);
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'quarterly' }).success).toBe(false);
    expect(vacayYearSettingsRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an out-of-range month or day', () => {
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'fiscal', year_start_month: 13 }).success).toBe(false);
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'fiscal', year_start_month: 0 }).success).toBe(false);
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'fiscal', year_start_day: 32 }).success).toBe(false);
  });

  it('takes a null hire_date but not a malformed one', () => {
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'anniversary', hire_date: null }).success).toBe(true);
    expect(vacayYearSettingsRequestSchema.safeParse({ year_type: 'anniversary', hire_date: '16.09.2019' }).success).toBe(false);
  });
});

describe('vacayAddYearRequestSchema', () => {
  it('accepts a numeric or string year', () => {
    expect(vacayAddYearRequestSchema.safeParse({ year: 2027 }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({ year: '2027' }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({}).success).toBe(false);
  });
});
