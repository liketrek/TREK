/**
 * The First trip / Last trip dates behind the Atlas tooltip (#1535). Pure, so no DB:
 * every case is a set of trips and the status the country ended up with.
 */
import { describe, it, expect } from 'vitest';

import { countryVisitDates } from '../../../src/nest/atlas/visit-dates';

const TODAY = '2026-09-15';

describe('countryVisitDates', () => {
  it('ATLAS-DATES-001: a trip over two months keeps both months', () => {
    expect(countryVisitDates([{ start_date: '2025-03-28', end_date: '2025-04-12' }], 'visited', TODAY)).toEqual({
      firstVisit: '2025-03-28',
      lastVisit: '2025-04-12',
    });
  });

  it('ATLAS-DATES-002: several visited trips span from the earliest start to the latest end', () => {
    const trips = [
      { start_date: '2024-06-01', end_date: '2024-06-10' },
      { start_date: '2022-01-05', end_date: '2022-01-20' },
      { start_date: '2023-07-01', end_date: '2023-07-03' },
    ];
    expect(countryVisitDates(trips, 'visited', TODAY)).toEqual({ firstVisit: '2022-01-05', lastVisit: '2024-06-10' });
  });

  it('ATLAS-DATES-003: a visited country ignores its planned and dateless trips', () => {
    const trips = [
      { start_date: '2025-05-01', end_date: '2025-05-04' },
      { start_date: '2027-01-01', end_date: '2027-01-09' },
      { start_date: null, end_date: null },
    ];
    expect(countryVisitDates(trips, 'visited', TODAY)).toEqual({ firstVisit: '2025-05-01', lastVisit: '2025-05-04' });
  });

  it('ATLAS-DATES-004: a trip still under way ends today', () => {
    expect(countryVisitDates([{ start_date: '2026-09-10', end_date: '2026-09-20' }], 'visited', TODAY)).toEqual({
      firstVisit: '2026-09-10',
      lastVisit: TODAY,
    });
  });

  it('ATLAS-DATES-005: a planned country keeps its future dates', () => {
    const trips = [
      { start_date: '2027-03-01', end_date: '2027-03-08' },
      { start_date: '2026-12-20', end_date: '2026-12-27' },
    ];
    expect(countryVisitDates(trips, 'planned', TODAY)).toEqual({ firstVisit: '2026-12-20', lastVisit: '2027-03-08' });
  });

  it('ATLAS-DATES-006: a trip with one date only starts and ends on it', () => {
    expect(countryVisitDates([{ start_date: '2025-02-02' }], 'visited', TODAY)).toEqual({
      firstVisit: '2025-02-02',
      lastVisit: '2025-02-02',
    });
    expect(countryVisitDates([{ start_date: null, end_date: '2025-02-09' }], 'visited', TODAY)).toEqual({
      firstVisit: '2025-02-09',
      lastVisit: '2025-02-09',
    });
  });

  it('ATLAS-DATES-007: an end typed before the start does not end the trip before it began', () => {
    expect(countryVisitDates([{ start_date: '2025-02-10', end_date: '2025-02-01' }], 'visited', TODAY)).toEqual({
      firstVisit: '2025-02-10',
      lastVisit: '2025-02-10',
    });
  });

  it('ATLAS-DATES-008: no matching trip gives no dates', () => {
    expect(countryVisitDates([], 'visited', TODAY)).toEqual({ firstVisit: null, lastVisit: null });
    expect(countryVisitDates([{ start_date: '2027-01-01', end_date: '2027-01-02' }], 'visited', TODAY)).toEqual({
      firstVisit: null,
      lastVisit: null,
    });
    expect(countryVisitDates([{ start_date: null, end_date: null }], 'idea', TODAY)).toEqual({
      firstVisit: null,
      lastVisit: null,
    });
  });
});
