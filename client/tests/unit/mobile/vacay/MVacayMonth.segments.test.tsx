// FE-MOB-MVACMS-001 to FE-MOB-MVACMS-002
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MVacayMonth from '../../../../src/mobile/screens/vacay/MVacayMonth';
import { personTint } from '../../../../src/mobile/screens/vacay/vacayDayModel';
import type { DayVisualContext } from '../../../../src/mobile/screens/vacay/vacayDayModel';

/** jsdom rewrites hsl() to rgb() on assignment — compare through the same path. */
function asRendered(css: string): string {
  const probe = document.createElement('div');
  probe.style.background = css;
  return probe.style.background;
}

const base: DayVisualContext = {
  todayStr: '2099-01-01',
  entryMap: {},
  companyHolidaySet: new Set(),
  companyHolidaysEnabled: true,
  holidays: {},
  weekendDays: [0, 6],
};

function renderMonth(ctx: DayVisualContext) {
  return render(
    <MVacayMonth
      year={2026}
      month={5}
      variant="full"
      weekStart={1}
      ctx={ctx}
      tripDates={new Set()}
      tripDotColor="#3b82f6"
      onDayTap={() => {}}
    />,
  );
}

describe('MVacayMonth segments', () => {
  it('FE-MOB-MVACMS-001: several people share the cell as equal-width segments', () => {
    renderMonth({
      ...base,
      entryMap: {
        '2026-06-15': [
          { date: '2026-06-15', user_id: 1, person_color: '#3b82f6' },
          { date: '2026-06-15', user_id: 2, person_color: '#ec4899', kind: 'comp' },
        ],
      },
    });

    const cell = screen.getByRole('button', { name: '2026-06-15' });
    const segments = [...cell.querySelectorAll<HTMLElement>('.absolute.top-0')];

    expect(segments).toHaveLength(2);
    expect(segments[0].style.width).toBe('50%');
    expect(segments[1].style.left).toBe('50%');
    // The vacation segment is a solid tint, the comp one is hatched.
    expect(segments[0].style.background).toBe(asRendered(personTint('#3b82f6')));
    expect(segments[1].style.background).toContain('repeating-linear-gradient(45deg');
    // With overlays the cell itself stays transparent underneath them.
    expect(cell.style.background).toBe('transparent');
  });

  it('FE-MOB-MVACMS-002: a single person fills the cell without overlays', () => {
    renderMonth({
      ...base,
      entryMap: { '2026-06-15': [{ date: '2026-06-15', user_id: 1, person_color: '#3b82f6' }] },
    });

    const cell = screen.getByRole('button', { name: '2026-06-15' });
    expect(cell.querySelectorAll('.absolute.top-0')).toHaveLength(0);
    expect(cell.style.background).toBe(asRendered(personTint('#3b82f6')));
  });
});
