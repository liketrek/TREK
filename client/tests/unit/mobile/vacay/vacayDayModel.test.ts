import { describe, it, expect } from 'vitest';
import { dayVisual, monthLead, personTint, splitBackground, type DayVisualContext } from '../../../../src/mobile/screens/vacay/vacayDayModel';

// FE-MOB-VACAY-001 onwards

function ctx(overrides: Partial<DayVisualContext> = {}): DayVisualContext {
  return {
    todayStr: '2026-07-15',
    entryMap: {},
    companyHolidaySet: new Set(),
    companyHolidaysEnabled: true,
    holidays: {},
    weekendDays: [0, 6],
    ...overrides,
  };
}

describe('vacayDayModel', () => {
  it('FE-MOB-VACAY-001: applies the day-cell matrix in priority order', () => {
    const entry = { date: '2026-07-15', user_id: 1, person_color: '#EC4899' };
    const holiday = { name: 'Holiday', localName: 'Feiertag', color: '#fecaca', label: null };
    const full = ctx({
      entryMap: { '2026-07-15': [entry] },
      companyHolidaySet: new Set(['2026-07-15']),
      holidays: { '2026-07-15': holiday },
    });

    // Today wins over everything: ring, no fill.
    expect(dayVisual('2026-07-15', 3, full)).toEqual({
      background: 'transparent',
      numColor: 'var(--m-ink)',
      boxShadow: 'inset 0 0 0 1.5px var(--m-ink)',
    });

    // Company holiday beats logged entries and public holidays.
    const notToday = ctx({
      todayStr: '2026-01-01',
      entryMap: { '2026-07-15': [entry] },
      companyHolidaySet: new Set(['2026-07-15']),
      holidays: { '2026-07-15': holiday },
    });
    expect(dayVisual('2026-07-15', 3, notToday)).toEqual({ background: '#F5D9A6', numColor: '#8A5A00' });

    // ...but not when company holidays are disabled.
    expect(dayVisual('2026-07-15', 3, { ...notToday, companyHolidaysEnabled: false }).numColor).toBe('#101013');

    // Logged person: pastel tint of the person color, hard dark digit.
    const logged = ctx({ todayStr: '2026-01-01', entryMap: { '2026-07-15': [entry] } });
    expect(dayVisual('2026-07-15', 3, logged)).toEqual({
      background: personTint('#EC4899'),
      numColor: '#101013',
    });

    // Public holiday: calendar color fill.
    const holidayOnly = ctx({ todayStr: '2026-01-01', holidays: { '2026-07-15': holiday } });
    expect(dayVisual('2026-07-15', 3, holidayOnly).background).toBe('#fecaca');

    // Weekend, then plain.
    expect(dayVisual('2026-07-18', 6, ctx({ todayStr: '2026-01-01' }))).toEqual({
      background: 'var(--m-ic)',
      numColor: 'var(--m-faint)',
    });
    expect(dayVisual('2026-07-16', 4, ctx({ todayStr: '2026-01-01' }))).toEqual({
      background: 'transparent',
      numColor: 'var(--m-muted)',
    });
  });

  it('FE-MOB-VACAY-002: splits logged days evenly and offsets month starts by week start', () => {
    const two = ctx({
      todayStr: '2026-01-01',
      entryMap: {
        '2026-07-15': [
          { date: '2026-07-15', user_id: 1, person_color: '#EC4899' },
          { date: '2026-07-15', user_id: 2, person_color: '#2FA9A0' },
        ],
      },
    });
    expect(dayVisual('2026-07-15', 3, two).background).toBe(
      splitBackground([personTint('#EC4899'), personTint('#2FA9A0')]),
    );
    expect(splitBackground(['a', 'b'])).toBe('linear-gradient(105deg,a 0% 50%,b 50% 100%)');

    // July 2026 starts on a Wednesday: 2 leading cells Monday-first, 3 Sunday-first.
    expect(monthLead(2026, 6, 1)).toBe(2);
    expect(monthLead(2026, 6, 0)).toBe(3);
  });
});
