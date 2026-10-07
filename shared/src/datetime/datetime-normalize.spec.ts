import { parseMeridiemClock, splitLocalDateTime, normalizeLocalDateTime } from './datetime-normalize';

import { describe, it, expect } from 'vitest';

describe('parseMeridiemClock', () => {
  it('resolves the half of the day', () => {
    expect(parseMeridiemClock('01:11 pm')).toBe('13:11');
    expect(parseMeridiemClock('09:51 am')).toBe('09:51');
    expect(parseMeridiemClock('3 PM')).toBe('15:00');
    expect(parseMeridiemClock('02:30:00 p.m.')).toBe('14:30');
  });

  it('keeps noon at 12 and midnight at 00', () => {
    expect(parseMeridiemClock('12:05 pm')).toBe('12:05');
    expect(parseMeridiemClock('12:05 am')).toBe('00:05');
  });

  it('returns null when there is no meridiem to resolve', () => {
    expect(parseMeridiemClock('13:11')).toBeNull();
    expect(parseMeridiemClock('')).toBeNull();
    expect(parseMeridiemClock(null)).toBeNull();
    // 13 with a meridiem is not a 12-hour clock, so it is not ours to rewrite.
    expect(parseMeridiemClock('13:11 pm')).toBeNull();
  });
});

describe('splitLocalDateTime', () => {
  it('reads a printed 12-hour clock instead of slicing it', () => {
    // The defect this pins: 'T02:30 PM'.slice(11, 16) is '02:30'. The hour
    // survives and the booking lands twelve hours early (#2094).
    expect(splitLocalDateTime('2026-06-11T02:30 PM')).toEqual({ date: '2026-06-11', time: '14:30' });
  });

  it('leaves a 24-hour value exactly as it is', () => {
    expect(splitLocalDateTime('2026-06-11T13:11:00')).toEqual({ date: '2026-06-11', time: '13:11' });
    expect(splitLocalDateTime('2026-06-11')).toEqual({ date: '2026-06-11', time: null });
  });

  it('has no date to give when the value does not start with one', () => {
    expect(splitLocalDateTime('Aug 23 2025 10:00')).toEqual({ date: null, time: null });
    expect(splitLocalDateTime(undefined)).toEqual({ date: null, time: null });
  });
});

describe('normalizeLocalDateTime', () => {
  it('rewrites only the clock, and keeps the seconds it was given', () => {
    expect(normalizeLocalDateTime('2026-06-11T02:30 PM')).toBe('2026-06-11T14:30:00');
    expect(normalizeLocalDateTime('2026-06-11T02:30:45 pm')).toBe('2026-06-11T14:30:45');
  });

  it('touches nothing that has no meridiem on it', () => {
    // Strictly additive: a date-only value stays date-only (the calendar
    // branches on whether the string contains a 'T' and would turn an all-day
    // event into a midnight point), an offset survives, and an unreadable
    // shape keeps whatever it meant before.
    expect(normalizeLocalDateTime('2026-06-11')).toBe('2026-06-11');
    expect(normalizeLocalDateTime('2026-06-11T13:11:00')).toBe('2026-06-11T13:11:00');
    expect(normalizeLocalDateTime('2026-06-11T13:11:00+02:00')).toBe('2026-06-11T13:11:00+02:00');
    expect(normalizeLocalDateTime('Aug 23 2025 10:00')).toBe('Aug 23 2025 10:00');
    expect(normalizeLocalDateTime('')).toBe('');
  });
});
