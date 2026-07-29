// FE-MOB-MVACDM-001 to FE-MOB-MVACDM-007
import { describe, it, expect } from 'vitest';
import { dayVisual, hatchTint, holidayInk, personTint } from '../../../../src/mobile/screens/vacay/vacayDayModel';
import type { DayVisualContext } from '../../../../src/mobile/screens/vacay/vacayDayModel';

function ctx(over: Partial<DayVisualContext> = {}): DayVisualContext {
  return {
    todayStr: '2099-01-01',
    entryMap: {},
    companyHolidaySet: new Set(),
    companyHolidaysEnabled: true,
    holidays: {},
    weekendDays: [0, 6],
    ...over,
  };
}

describe('vacayDayModel colors', () => {
  it('FE-MOB-MVACDM-001: a colour that is not a plain hex is passed through untouched', () => {
    expect(personTint('var(--m-act)')).toBe('var(--m-act)');
    expect(holidayInk('rgb(1,2,3)')).toBe('var(--m-ink)');
  });

  it('FE-MOB-MVACDM-002: a neutral grey keeps hue and saturation at zero', () => {
    expect(personTint('#808080')).toBe('hsl(0 0% 85%)');
  });

  it('FE-MOB-MVACDM-003: the hue is derived from whichever channel dominates', () => {
    // Red-, green- and blue-dominant inputs each take a different hue branch.
    expect(personTint('#ef4444')).toMatch(/^hsl\(0 /);
    expect(personTint('#22c55e')).toMatch(/^hsl\(142 /);
    expect(personTint('#3b82f6')).toMatch(/^hsl\(217 /);
  });

  it('FE-MOB-MVACDM-004: a half day is flagged so the cell can badge it', () => {
    const visual = dayVisual('2026-06-15', 1, ctx({
      entryMap: { '2026-06-15': [{ date: '2026-06-15', user_id: 1, fraction: 0.5, person_color: '#3b82f6' }] },
    }));

    expect(visual.half).toBe(true);
    expect(visual.segments).toEqual([{ color: personTint('#3b82f6'), comp: false }]);
  });

  it('FE-MOB-MVACDM-005: an all-comp day is hatched and carries its own text shadow', () => {
    const visual = dayVisual('2026-06-15', 1, ctx({
      entryMap: { '2026-06-15': [{ date: '2026-06-15', user_id: 1, kind: 'comp', person_color: '#3b82f6' }] },
    }));

    expect(visual.background).toBe(hatchTint(personTint('#3b82f6')));
    expect(visual.textShadow).toBeDefined();
  });

  it('FE-MOB-MVACDM-006: a plain school-break day gets the wash and a tinted ink', () => {
    const visual = dayVisual('2026-06-15', 1, ctx({
      holidays: {
        '2026-06-15': [{ name: 'Sommer', localName: 'Sommer', color: '#bbf7d0', label: null, type: 'school_holiday' }],
      },
    }));

    expect(visual.school).toEqual(['#bbf7d0']);
    expect(visual.background).toBe('color-mix(in srgb, #bbf7d0 15%, transparent)');
    expect(visual.numColor).toBe(holidayInk('#bbf7d0'));
  });

  it('FE-MOB-MVACDM-007: a school break on a logged day only adds the accent band', () => {
    const visual = dayVisual('2026-06-15', 1, ctx({
      entryMap: { '2026-06-15': [{ date: '2026-06-15', user_id: 1, person_color: '#3b82f6' }] },
      holidays: {
        '2026-06-15': [{ name: 'Sommer', localName: 'Sommer', color: '#bbf7d0', label: null, type: 'school_holiday' }],
      },
    }));

    expect(visual.school).toEqual(['#bbf7d0']);
    expect(visual.background).toBe(personTint('#3b82f6'));
  });
});
