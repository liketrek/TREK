import {
  localParts,
  offsetMinutesAt,
  resolveTimeZone,
  wallClockInstant,
} from '../../../../src/nest/common/timezoneService';

import { describe, expect, it } from 'vitest';

describe('timezoneService', () => {
  it('resolves valid coordinates and rejects missing or invalid values', () => {
    expect(resolveTimeZone(35.6762, 139.6503)).toBe('Asia/Tokyo');
    expect(resolveTimeZone(null, 139.6503)).toBeNull();
    expect(resolveTimeZone(91, 139.6503)).toBeNull();
  });

  it('converts instants to local date and time', () => {
    expect(localParts('2026-12-03T00:00:00Z', 'Asia/Tokyo')).toEqual({ date: '2026-12-03', time: '09:00' });
    expect(localParts('invalid', 'Asia/Tokyo')).toEqual({ date: null, time: null });
    expect(localParts(null, null)).toEqual({ date: null, time: null });
  });

  it('TZSVC-001: reads a zone offset in minutes east of UTC, summer and winter', () => {
    expect(offsetMinutesAt('Europe/Berlin', Date.UTC(2026, 6, 1))).toBe(120);
    expect(offsetMinutesAt('Europe/Berlin', Date.UTC(2026, 0, 1))).toBe(60);
    expect(offsetMinutesAt('America/St_Johns', Date.UTC(2026, 0, 1))).toBe(-210);
    expect(offsetMinutesAt('UTC', Date.UTC(2026, 0, 1))).toBe(0);
  });

  it('TZSVC-002: turns a wall clock in a zone into its instant', () => {
    expect(wallClockInstant('2026-06-03', '08:15', 'Europe/Berlin')).toBe(Date.UTC(2026, 5, 3, 6, 15));
    expect(wallClockInstant('2026-06-03', '11:05', 'America/New_York')).toBe(Date.UTC(2026, 5, 3, 15, 5));
    // On the day the clocks go back, a midday clock already reads winter time.
    expect(wallClockInstant('2026-10-25', '12:00', 'Europe/Berlin')).toBe(Date.UTC(2026, 9, 25, 11, 0));
  });

  it('TZSVC-003: refuses a malformed date, a malformed time and a zone that does not exist', () => {
    expect(wallClockInstant('2026-6-3', '08:15', 'Europe/Berlin')).toBeNull();
    expect(wallClockInstant('2026-06-03', '24:00', 'Europe/Berlin')).toBeNull();
    expect(wallClockInstant('2026-06-03', '08:15', 'Mars/Olympus')).toBeNull();
  });

  it('TZSVC-004: refuses a day the month does not have instead of rolling it over', () => {
    expect(wallClockInstant('2026-02-31', '08:15', 'Europe/Berlin')).toBeNull();
    expect(wallClockInstant('2026-04-31', '08:15', 'Europe/Berlin')).toBeNull();
    expect(wallClockInstant('2026-13-01', '08:15', 'Europe/Berlin')).toBeNull();
    expect(wallClockInstant('2028-02-29', '08:15', 'UTC')).toBe(Date.UTC(2028, 1, 29, 8, 15));
  });
});
