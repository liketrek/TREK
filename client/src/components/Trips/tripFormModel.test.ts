// FE-COMP-TRIPFORMMODEL-001 to -007: the trip form checks the dialog and the phone sheet share.
import { MAX_TRIP_DAYS, addIsoDays } from '@trek/shared';

import { endDateForNewStart, tripFormError } from './tripFormModel';

const t = (key: string, params?: Record<string, string | number>) => (params ? `${key}:${params.count}` : key);

describe('tripFormError', () => {
  it('FE-COMP-TRIPFORMMODEL-001: a blank title is refused first', () => {
    expect(tripFormError({ title: '   ', startDate: '2026-05-02', endDate: '2026-05-01' }, null, t)).toBe(
      'dashboard.titleRequired'
    );
  });

  it('FE-COMP-TRIPFORMMODEL-002: an end before the start is refused', () => {
    expect(tripFormError({ title: 'Rome', startDate: '2026-05-02', endDate: '2026-05-01' }, null, t)).toBe(
      'dashboard.endDateError'
    );
  });

  it('FE-COMP-TRIPFORMMODEL-003: a new range past the limit is refused, an untouched stored one is not', () => {
    const start = '2020-01-01';
    const end = addIsoDays(start, MAX_TRIP_DAYS);
    expect(tripFormError({ title: 'Long', startDate: start, endDate: end }, null, t)).toBe(
      `dashboard.tripTooLong:${MAX_TRIP_DAYS}`
    );
    expect(
      tripFormError({ title: 'Long', startDate: start, endDate: end }, { start_date: start, end_date: end }, t)
    ).toBe('');
    expect(
      tripFormError({ title: 'Long', startDate: start, endDate: end }, { start_date: start, end_date: '2020-01-05' }, t)
    ).toBe(`dashboard.tripTooLong:${MAX_TRIP_DAYS}`);
  });

  it('FE-COMP-TRIPFORMMODEL-004: a valid form or one without dates passes', () => {
    expect(tripFormError({ title: 'Rome', startDate: '2026-05-01', endDate: '2026-05-01' }, null, t)).toBe('');
    expect(tripFormError({ title: 'Rome', startDate: '', endDate: '' }, null, t)).toBe('');
    expect(tripFormError({ title: 'Rome', startDate: '2026-05-01', endDate: '' }, null, t)).toBe('');
  });
});

describe('endDateForNewStart', () => {
  it('FE-COMP-TRIPFORMMODEL-005: a valid range keeps its length when the start moves', () => {
    expect(endDateForNewStart('2026-05-01', '2026-05-08', '2026-06-10')).toBe('2026-06-17');
    expect(endDateForNewStart('2026-05-01', '2026-05-08', '2026-04-20')).toBe('2026-04-27');
  });

  it('FE-COMP-TRIPFORMMODEL-006: without a valid range the end only follows a start past it', () => {
    expect(endDateForNewStart('', '', '2026-05-01')).toBe('2026-05-01');
    expect(endDateForNewStart('', '2026-05-03', '2026-05-01')).toBe('2026-05-03');
    expect(endDateForNewStart('', '2026-05-03', '2026-05-09')).toBe('2026-05-09');
    expect(endDateForNewStart('2026-05-08', '2026-05-03', '2026-05-05')).toBe('2026-05-05');
    expect(endDateForNewStart('2026-05-01', '2026-05-08', '')).toBe('2026-05-08');
  });

  it('FE-COMP-TRIPFORMMODEL-007: the kept length counts calendar days across a DST change', () => {
    const runnerTimeZone = process.env.TZ;
    process.env.TZ = 'Europe/Berlin';
    try {
      // Summer time starts on 2026-03-29 in Berlin.
      expect(endDateForNewStart('2026-03-20', '2026-03-25', '2026-03-27')).toBe('2026-04-01');
    } finally {
      if (runnerTimeZone === undefined) delete process.env.TZ;
      else process.env.TZ = runnerTimeZone;
    }
  });
});
