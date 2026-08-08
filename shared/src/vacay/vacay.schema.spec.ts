import {
  vacayAddHolidayCalendarRequestSchema,
  vacayCompanyHolidayRequestSchema,
  vacayInviteActionRequestSchema,
  vacayInviteRequestSchema,
  vacaySetColorRequestSchema,
  vacayShareRequestSchema,
  vacayShareUpdateRequestSchema,
  vacayToggleEntryRequestSchema,
  vacayAddYearRequestSchema,
  vacayUpdateHolidayCalendarRequestSchema,
  vacayUpdatePlanRequestSchema,
  vacayUpdateStatsRequestSchema,
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
    expect(
      vacayYearSettingsRequestSchema.safeParse({ year_type: 'anniversary', hire_date: '16.09.2019' }).success,
    ).toBe(false);
  });
});

describe('vacayAddYearRequestSchema', () => {
  it('accepts a numeric or string year', () => {
    expect(vacayAddYearRequestSchema.safeParse({ year: 2027 }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({ year: '2027' }).success).toBe(true);
    expect(vacayAddYearRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayUpdatePlanRequestSchema', () => {
  it('accepts any partial subset of the plan settings', () => {
    expect(vacayUpdatePlanRequestSchema.safeParse({}).success).toBe(true);
    expect(vacayUpdatePlanRequestSchema.safeParse({ block_weekends: true }).success).toBe(true);
    expect(
      vacayUpdatePlanRequestSchema.safeParse({ weekend_days: '0,6', week_start: 0, carry_over_enabled: false }).success,
    ).toBe(true);
  });

  it('takes null to clear holidays_region but rejects wrong types', () => {
    expect(vacayUpdatePlanRequestSchema.safeParse({ holidays_region: null }).success).toBe(true);
    expect(vacayUpdatePlanRequestSchema.safeParse({ holidays_region: 'CH' }).success).toBe(true);
    expect(vacayUpdatePlanRequestSchema.safeParse({ block_weekends: 'yes' }).success).toBe(false);
    expect(vacayUpdatePlanRequestSchema.safeParse({ week_start: 'monday' }).success).toBe(false);
  });
});

describe('vacayUpdateHolidayCalendarRequestSchema', () => {
  it('accepts any partial subset including a null label', () => {
    expect(vacayUpdateHolidayCalendarRequestSchema.safeParse({}).success).toBe(true);
    expect(vacayUpdateHolidayCalendarRequestSchema.safeParse({ region: 'DE-BY', label: null }).success).toBe(true);
    expect(
      vacayUpdateHolidayCalendarRequestSchema.safeParse({ type: 'school_holiday', color: '#a5f3fc', sort_order: 2 }).success,
    ).toBe(true);
    expect(vacayUpdateHolidayCalendarRequestSchema.safeParse({ type: 'bank_holiday' }).success).toBe(false);
  });
});

describe('vacaySetColorRequestSchema', () => {
  it('color and target_user_id are both optional', () => {
    expect(vacaySetColorRequestSchema.safeParse({}).success).toBe(true);
    expect(vacaySetColorRequestSchema.safeParse({ color: '#6366f1' }).success).toBe(true);
    expect(vacaySetColorRequestSchema.safeParse({ color: '#6366f1', target_user_id: '3' }).success).toBe(true);
    expect(vacaySetColorRequestSchema.safeParse({ color: 42 }).success).toBe(false);
  });
});

describe('vacayInviteActionRequestSchema', () => {
  it('plan_id is optional (a missing id falls through to the 404 path)', () => {
    expect(vacayInviteActionRequestSchema.safeParse({}).success).toBe(true);
    expect(vacayInviteActionRequestSchema.safeParse({ plan_id: 7 }).success).toBe(true);
    expect(vacayInviteActionRequestSchema.safeParse({ plan_id: '7' }).success).toBe(false);
  });
});

describe('vacayCompanyHolidayRequestSchema', () => {
  it('requires a date; note optional', () => {
    expect(vacayCompanyHolidayRequestSchema.safeParse({ date: '2026-12-24' }).success).toBe(true);
    expect(vacayCompanyHolidayRequestSchema.safeParse({ date: '2026-12-24', note: 'Xmas eve' }).success).toBe(true);
    expect(vacayCompanyHolidayRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayUpdateStatsRequestSchema', () => {
  it('vacation_days and target_user_id are both optional', () => {
    expect(vacayUpdateStatsRequestSchema.safeParse({}).success).toBe(true);
    expect(vacayUpdateStatsRequestSchema.safeParse({ vacation_days: 25 }).success).toBe(true);
    expect(vacayUpdateStatsRequestSchema.safeParse({ vacation_days: 25, target_user_id: 3 }).success).toBe(true);
    expect(vacayUpdateStatsRequestSchema.safeParse({ vacation_days: 'many' }).success).toBe(false);
  });
});

describe('vacayShareRequestSchema', () => {
  it('accepts a numeric or string user_id', () => {
    expect(vacayShareRequestSchema.safeParse({ user_id: 2 }).success).toBe(true);
    expect(vacayShareRequestSchema.safeParse({ user_id: '2' }).success).toBe(true);
    expect(vacayShareRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('vacayShareUpdateRequestSchema', () => {
  it('requires a boolean hidden flag', () => {
    expect(vacayShareUpdateRequestSchema.safeParse({ hidden: true }).success).toBe(true);
    expect(vacayShareUpdateRequestSchema.safeParse({ hidden: 1 }).success).toBe(false);
    expect(vacayShareUpdateRequestSchema.safeParse({}).success).toBe(false);
  });
});
