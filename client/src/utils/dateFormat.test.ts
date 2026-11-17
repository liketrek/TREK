// FE-UTIL-DATEFMT-001 to FE-UTIL-DATEFMT-023
import { describe, expect, it } from 'vitest';
import {
  dateFieldOrder,
  dateFormatOptions,
  dateLayout,
  formatDisplayDate,
  formatDisplayDateTime,
  isNumericDate,
} from './dateFormat';

// 31 December 2026, 15:04 UTC: no day of it reads as a month, so every layout is unambiguous.
const NYE = new Date(Date.UTC(2026, 11, 31, 15, 4));
const UTC = { timeZone: 'UTC' } as const;
const NUMERIC: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' };

describe('dateFormat (#2971)', () => {
  describe('formatDisplayDate', () => {
    it('FE-UTIL-DATEFMT-001: auto, an unknown value or none is exactly toLocaleDateString', () => {
      const cases: [string, Intl.DateTimeFormatOptions | undefined][] = [
        ['en-US', undefined],
        ['en-US', NUMERIC],
        ['de-DE', NUMERIC],
        ['ko-KR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }],
        ['en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' }],
      ];
      for (const [locale, opts] of cases) {
        const expected = NYE.toLocaleDateString(locale, opts);
        expect(formatDisplayDate(NYE, locale, opts, 'auto')).toBe(expected);
        expect(formatDisplayDate(NYE, locale, opts, 'DD-MM-YY')).toBe(expected);
        expect(formatDisplayDate(NYE, locale, opts, null)).toBe(expected);
        expect(formatDisplayDate(NYE, locale, opts)).toBe(expected);
      }
    });

    it('FE-UTIL-DATEFMT-002: each format writes 31 December 2026 in its own layout', () => {
      expect(formatDisplayDate(NYE, 'en-US', UTC, 'YYYY-MM-DD')).toBe('2026-12-31');
      expect(formatDisplayDate(NYE, 'en-US', UTC, 'YYYY/MM/DD')).toBe('2026/12/31');
      expect(formatDisplayDate(NYE, 'en-US', UTC, 'DD.MM.YYYY')).toBe('31.12.2026');
      expect(formatDisplayDate(NYE, 'en-US', UTC, 'DD/MM/YYYY')).toBe('31/12/2026');
      expect(formatDisplayDate(NYE, 'de-DE', UTC, 'MM/DD/YYYY')).toBe('12/31/2026');
    });

    it('FE-UTIL-DATEFMT-003: the language does not change a chosen format', () => {
      for (const locale of ['en-US', 'de-DE', 'ko-KR', 'ar', 'fr-FR']) {
        expect(formatDisplayDate(NYE, locale, NUMERIC, 'YYYY-MM-DD')).toBe('2026-12-31');
      }
    });

    it('FE-UTIL-DATEFMT-004: single-digit days and months are padded', () => {
      const march = new Date(Date.UTC(2026, 2, 5));
      expect(
        formatDisplayDate(
          march,
          'en-US',
          { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' },
          'DD.MM.YYYY'
        )
      ).toBe('05.03.2026');
    });

    it('FE-UTIL-DATEFMT-005: year 2-digit keeps two digits of the year', () => {
      const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' };
      expect(formatDisplayDate(NYE, 'en-US', opts, 'DD.MM.YYYY')).toBe('31.12.26');
      expect(formatDisplayDate(NYE, 'en-US', opts, 'YYYY-MM-DD')).toBe('26-12-31');
    });

    it('FE-UTIL-DATEFMT-006: day and month without a year write only those two, in layout order', () => {
      const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', timeZone: 'UTC' };
      expect(formatDisplayDate(NYE, 'en-US', opts, 'DD.MM.YYYY')).toBe('31.12');
      expect(formatDisplayDate(NYE, 'en-US', opts, 'YYYY-MM-DD')).toBe('12-31');
      expect(formatDisplayDate(NYE, 'en-US', opts, 'MM/DD/YYYY')).toBe('12/31');
    });

    it('FE-UTIL-DATEFMT-007: a month name or a long dateStyle is left to Intl', () => {
      const named: Intl.DateTimeFormatOptions[] = [
        { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' },
        { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' },
        { month: 'long', year: 'numeric', timeZone: 'UTC' },
        { dateStyle: 'long', timeZone: 'UTC' },
        { dateStyle: 'full', timeZone: 'UTC' },
      ];
      for (const opts of named) {
        expect(formatDisplayDate(NYE, 'de-DE', opts, 'YYYY-MM-DD')).toBe(NYE.toLocaleDateString('de-DE', opts));
      }
    });

    it('FE-UTIL-DATEFMT-022: dateStyle medium follows the format where the language writes it in numbers', () => {
      const opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeZone: 'UTC' };
      // German "31.12.2026", Japanese "2026/12/31", Czech "31. 12. 2026", Korean "2026. 12. 31.".
      for (const locale of ['de-DE', 'ja-JP', 'cs-CZ', 'ko-KR']) {
        expect(formatDisplayDate(NYE, locale, opts, 'YYYY-MM-DD')).toBe('2026-12-31');
      }
      // English and French name the month, Chinese writes words between the numbers.
      for (const locale of ['en-US', 'fr-FR', 'zh-CN']) {
        expect(formatDisplayDate(NYE, locale, opts, 'YYYY-MM-DD')).toBe(NYE.toLocaleDateString(locale, opts));
      }
      expect(formatDisplayDate(NYE, 'de-DE', opts, 'auto')).toBe(NYE.toLocaleDateString('de-DE', opts));
    });

    it('FE-UTIL-DATEFMT-021: a weekday beside a numeric date keeps the language, the date takes the format', () => {
      const opts: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      };
      expect(formatDisplayDate(NYE, 'de-DE', opts, 'YYYY-MM-DD')).toBe(
        `${NYE.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'UTC' })}, 2026-12-31`
      );
      expect(formatDisplayDate(NYE, 'de-DE', opts, 'auto')).toBe(NYE.toLocaleDateString('de-DE', opts));
    });

    it('FE-UTIL-DATEFMT-008: dateStyle short counts as numeric', () => {
      expect(formatDisplayDate(NYE, 'en-US', { dateStyle: 'short', timeZone: 'UTC' }, 'DD/MM/YYYY')).toBe('31/12/2026');
    });

    it('FE-UTIL-DATEFMT-009: an invalid date falls back to toLocaleDateString', () => {
      const invalid = new Date('nope');
      expect(formatDisplayDate(invalid, 'en-US', NUMERIC, 'YYYY-MM-DD')).toBe(
        invalid.toLocaleDateString('en-US', NUMERIC)
      );
    });
  });

  describe('formatDisplayDateTime', () => {
    it('FE-UTIL-DATEFMT-010: auto, an unknown value or none is exactly toLocaleString', () => {
      const opts: Intl.DateTimeFormatOptions = { ...NUMERIC, hour: '2-digit', minute: '2-digit' };
      for (const locale of ['en-US', 'de-DE']) {
        expect(formatDisplayDateTime(NYE, locale, opts, 'auto')).toBe(NYE.toLocaleString(locale, opts));
        expect(formatDisplayDateTime(NYE, locale, opts, 'nope')).toBe(NYE.toLocaleString(locale, opts));
        expect(formatDisplayDateTime(NYE, locale, UTC)).toBe(NYE.toLocaleString(locale, UTC));
      }
    });

    it('FE-UTIL-DATEFMT-011: the date follows the format, the time of day stays Intl', () => {
      const opts: Intl.DateTimeFormatOptions = { ...NUMERIC, hour: '2-digit', minute: '2-digit' };
      const time = NYE.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      expect(formatDisplayDateTime(NYE, 'en-US', opts, 'YYYY-MM-DD')).toBe(`2026-12-31 ${time}`);
      const hour12 = { ...opts, hour12: false };
      const time24 = NYE.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      });
      expect(formatDisplayDateTime(NYE, 'en-US', hour12, 'DD.MM.YYYY')).toBe(`31.12.2026 ${time24}`);
    });

    it('FE-UTIL-DATEFMT-012: without options it writes the date and the default time', () => {
      expect(formatDisplayDateTime(NYE, 'en-US', UTC, 'DD/MM/YYYY')).toBe(
        `31/12/2026 ${NYE.toLocaleTimeString('en-US', UTC)}`
      );
    });

    it('FE-UTIL-DATEFMT-013: time-only options are passed through untouched', () => {
      const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
      expect(formatDisplayDateTime(NYE, 'de-DE', opts, 'YYYY-MM-DD')).toBe(NYE.toLocaleString('de-DE', opts));
    });

    it('FE-UTIL-DATEFMT-014: date-only options give just the date, named dates stay Intl', () => {
      expect(formatDisplayDateTime(NYE, 'en-US', NUMERIC, 'YYYY/MM/DD')).toBe('2026/12/31');
      const named: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        timeZone: 'UTC',
      };
      expect(formatDisplayDateTime(NYE, 'en-US', named, 'YYYY-MM-DD')).toBe(NYE.toLocaleString('en-US', named));
    });

    it('FE-UTIL-DATEFMT-023: dateStyle medium with a time puts the numeric date in the format', () => {
      const opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' };
      const time = NYE.toLocaleTimeString('de-DE', { timeStyle: 'short', timeZone: 'UTC' });
      expect(formatDisplayDateTime(NYE, 'de-DE', opts, 'DD/MM/YYYY')).toBe(`31/12/2026 ${time}`);
      expect(formatDisplayDateTime(NYE, 'en-US', opts, 'DD/MM/YYYY')).toBe(NYE.toLocaleString('en-US', opts));
    });
  });

  describe('dateFieldOrder, dateLayout and isNumericDate', () => {
    it('FE-UTIL-DATEFMT-018: a chosen format sets the order, auto asks the language', () => {
      expect(dateFieldOrder('en-US', 'DD.MM.YYYY')).toEqual(['day', 'month', 'year']);
      expect(dateFieldOrder('de-DE', 'MM/DD/YYYY')).toEqual(['month', 'day', 'year']);
      expect(dateFieldOrder('en-US', 'YYYY/MM/DD')).toEqual(['year', 'month', 'day']);
      expect(dateFieldOrder('de-DE', 'auto')).toEqual(['day', 'month', 'year']);
      expect(dateFieldOrder('en-US')).toEqual(['month', 'day', 'year']);
      expect(dateFieldOrder('ko-KR', null)).toEqual(['year', 'month', 'day']);
    });

    it('FE-UTIL-DATEFMT-019: dateLayout knows the five formats only, isNumericDate spots names', () => {
      expect(dateLayout('DD/MM/YYYY')).toEqual({ order: ['day', 'month', 'year'], separator: '/' });
      expect(dateLayout('auto')).toBeNull();
      expect(dateLayout('nope')).toBeNull();
      expect(dateLayout(undefined)).toBeNull();
      expect(isNumericDate()).toBe(true);
      expect(isNumericDate({ month: '2-digit' })).toBe(true);
      expect(isNumericDate({ month: 'short' })).toBe(false);
      expect(isNumericDate({ weekday: 'long' })).toBe(false);
      expect(isNumericDate({ era: 'short' })).toBe(false);
      expect(isNumericDate({ dateStyle: 'short' })).toBe(true);
      expect(isNumericDate({ dateStyle: 'long' })).toBe(false);
      expect(isNumericDate({ dateStyle: 'medium' }, 'de-DE')).toBe(true);
      expect(isNumericDate({ dateStyle: 'medium' }, 'ja-JP')).toBe(true);
      expect(isNumericDate({ dateStyle: 'medium' }, 'en-US')).toBe(false);
      expect(isNumericDate({ dateStyle: 'long' }, 'de-DE')).toBe(false);
    });
  });

  describe('dateFormatOptions', () => {
    it('FE-UTIL-DATEFMT-020: every choice is labelled by how it writes 31 December, auto with its example', () => {
      expect(dateFormatOptions('en-US', 'Automatic')).toEqual([
        { value: 'auto', label: 'Automatic (12/31/2026)' },
        { value: 'YYYY-MM-DD', label: '2026-12-31' },
        { value: 'YYYY/MM/DD', label: '2026/12/31' },
        { value: 'DD.MM.YYYY', label: '31.12.2026' },
        { value: 'DD/MM/YYYY', label: '31/12/2026' },
        { value: 'MM/DD/YYYY', label: '12/31/2026' },
      ]);
      expect(dateFormatOptions('de-DE', 'Automatisch')[0]).toEqual({
        value: 'auto',
        label: 'Automatisch (31.12.2026)',
      });
    });
  });
});
