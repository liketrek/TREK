import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MVacayMonth from '../../../../src/mobile/screens/vacay/MVacayMonth';
import type { DayVisualContext } from '../../../../src/mobile/screens/vacay/vacayDayModel';

// FE-MOB-VACAY-010 onwards

const ctx: DayVisualContext = {
  todayStr: '2099-01-01',
  entryMap: {},
  companyHolidaySet: new Set(),
  companyHolidaysEnabled: true,
  holidays: {},
  weekendDays: [0, 6],
};

describe('MVacayMonth', () => {
  it('FE-MOB-VACAY-010: renders every day of the month and reports taps as ISO dates', () => {
    const onDayTap = vi.fn();
    render(
      <MVacayMonth
        year={2026}
        month={6}
        variant="mini"
        weekStart={1}
        ctx={ctx}
        tripDates={new Set()}
        tripDotColor="#EC4899"
        onDayTap={onDayTap}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(31);
    fireEvent.click(screen.getByRole('button', { name: '2026-07-15' }));
    expect(onDayTap).toHaveBeenCalledWith('2026-07-15');
  });

  it('FE-MOB-VACAY-011: marks trip-overlap days with a person-colored dot', () => {
    render(
      <MVacayMonth
        year={2026}
        month={6}
        variant="full"
        weekStart={1}
        ctx={ctx}
        tripDates={new Set(['2026-07-20'])}
        tripDotColor="#EC4899"
        onDayTap={() => {}}
      />,
    );

    const withDot = screen.getByRole('button', { name: '2026-07-20' });
    const dot = withDot.querySelector('span[aria-hidden]') as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.style.background).toBe('rgb(236, 72, 153)');
    expect(screen.getByRole('button', { name: '2026-07-21' }).querySelector('span[aria-hidden]')).toBeNull();
  });
});
