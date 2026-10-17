// FE-PLANNER-BKPARTS-001 to FE-PLANNER-BKPARTS-002
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BookingFacts } from './bookingFacts';
import { WhenFields } from './bookingParts';

function facts(day: BookingFacts['day'], time: string | null = '15:35 → 09:55'): BookingFacts {
  return {
    day,
    time,
    startTime: null,
    endTime: null,
    startDate: null,
    endDate: null,
    cells: [],
    endpoints: [],
    legCodes: [],
    place: null,
    accommodation: null,
    linked: null,
    url: null,
    isHotel: false,
  };
}

describe('WhenFields', () => {
  it('FE-PLANNER-BKPARTS-001: a long day title is cut, the date beside it never shrinks (#2590)', () => {
    render(
      <WhenFields
        facts={facts({
          label: 'Germany Departure Flight with a much longer custom title → Korea Arrival',
          date: 'Oct 21 → Oct 22',
          range: true,
        })}
      />
    );

    const title = screen.getByText('Germany Departure Flight with a much longer custom title → Korea Arrival');
    const date = screen.getByText('Oct 21 → Oct 22');
    expect(title).toHaveClass('truncate');
    expect(date).toHaveClass('flex-none');
    expect(title.contains(date)).toBe(false);
  });

  it('FE-PLANNER-BKPARTS-002: a day without a date prints its label alone', () => {
    render(<WhenFields facts={facts({ label: 'Day 3', date: null, range: false }, null)} />);
    expect(screen.getByText('Day 3')).toBeInTheDocument();
  });
});
