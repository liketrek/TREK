import {
  manualSchoolRegionId,
  schoolHolidayCountryRequestSchema,
  schoolHolidayPeriodSchema,
  schoolHolidayRegionRequestSchema,
} from './school-holiday-catalog.schema';

import { describe, expect, it } from 'vitest';

describe('manual school holiday contracts', () => {
  it('accepts a named break spanning New Year and leap days', () => {
    expect(
      schoolHolidayPeriodSchema.parse({ name: ' Winter ', startDate: '2026-12-20', endDate: '2027-01-06' }).name,
    ).toBe('Winter');
    expect(
      schoolHolidayPeriodSchema.safeParse({ name: 'Leap day', startDate: '2028-02-29', endDate: '2028-02-29' }).success,
    ).toBe(true);
  });
  it.each([
    ['2026-02-29', '2026-03-01'],
    ['2026-04-31', '2026-05-01'],
    ['2026-12-20', '2026-12-19'],
    ['2026-01-01', '2028-01-01'],
  ])('rejects invalid or unbounded dates %s to %s', (startDate, endDate) => {
    expect(schoolHolidayPeriodSchema.safeParse({ name: 'Break', startDate, endDate }).success).toBe(false);
  });
  it('requires a country code, names, revision and bounded periods', () => {
    expect(schoolHolidayCountryRequestSchema.safeParse({ code: '../', name: 'USA' }).success).toBe(false);
    expect(schoolHolidayCountryRequestSchema.safeParse({ code: 'US', name: ' ' }).success).toBe(false);
    expect(schoolHolidayRegionRequestSchema.safeParse({ name: 'District', revision: 0, holidays: [] }).success).toBe(
      true,
    );
    expect(schoolHolidayRegionRequestSchema.safeParse({ name: 'District', holidays: [] }).success).toBe(false);
    expect(
      schoolHolidayRegionRequestSchema.safeParse({
        name: 'District',
        revision: 0,
        holidays: Array(501).fill({ name: 'Break', startDate: '2026-01-01', endDate: '2026-01-02' }),
      }).success,
    ).toBe(false);
  });
  it('keeps manual ids distinct from provider subdivisions', () => {
    expect(manualSchoolRegionId('US-MANUAL-12')).toBe(12);
    for (const code of ['US-WA', 'NL|group:NL-NO', 'US-MANUAL-0', 'US-MANUAL-1junk'])
      expect(manualSchoolRegionId(code)).toBeNull();
  });
});
