import { describe, expect, it } from 'vitest';

import { journeyYearLabel } from './journeyModel';

describe('journeyYearLabel (#2685)', () => {
  it('FE-PAGE-JOURNEY-YEAR-001: names the year of the trips, not the year the journey was written', () => {
    expect(
      journeyYearLabel({ trip_date_min: '2024-09-12', trip_date_max: '2024-09-20', created_at: '2026-03-01 10:00:00' })
    ).toBe('2024');
  });

  it('FE-PAGE-JOURNEY-YEAR-002: a trip over New Year names both years', () => {
    expect(
      journeyYearLabel({ trip_date_min: '2024-12-28', trip_date_max: '2025-01-04', created_at: '2026-03-01 10:00:00' })
    ).toBe('2024/2025');
  });

  it('FE-PAGE-JOURNEY-YEAR-003: one known date is enough, and without any it falls back to when it was written', () => {
    expect(
      journeyYearLabel({ trip_date_min: null, trip_date_max: '2023-05-02', created_at: '2026-03-01 10:00:00' })
    ).toBe('2023');
    expect(journeyYearLabel({ trip_date_min: null, trip_date_max: null, created_at: '2026-03-01 10:00:00' })).toBe(
      '2026'
    );
  });
});
