import { describe, expect, it } from 'vitest';
import { formatDateRange } from '../../src/lib/format';

describe('formatDateRange', () => {
  it('APPS-FMT-001: formats a range, one date, or nothing', () => {
    // ICU puts thin spaces around the dash in some versions and none in others.
    expect(formatDateRange('2027-05-12', '2027-05-19', 'en-GB')).toMatch(/^12\s?–\s?19 May 2027$/u);
    expect(formatDateRange('2027-05-12', null, 'en-GB')).toBe('12 May 2027');
    expect(formatDateRange(null, '2027-05-19', 'en-GB')).toBe('19 May 2027');
    expect(formatDateRange(null, undefined, 'en-GB')).toBeNull();
  });

  it('APPS-FMT-002: ignores what is not a calendar day', () => {
    expect(formatDateRange('soon', 'later', 'en-GB')).toBeNull();
    expect(formatDateRange('2027-13-45', null, 'en-GB')).toBeNull();
  });
});
