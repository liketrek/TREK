// CW-02, CW-04: the day a city walk's times are for, picked where there is a
// choice, what is missing for them and where the hours come from.
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDay } from '../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { resetAllStores } from '../../../../tests/helpers/store';
import type { WalkDayChoice, WalkDayOption } from './useWalkDay';
import { WalkDayLine } from './WalkDayLine';
import type { WalkSchedule, WalkScheduleState } from './walkSchedule';

const monday: WalkDayOption = {
  day: buildDay({ id: 1, date: '2026-10-19', title: 'Old town' }),
  index: 0,
  start: null,
};
const tuesday: WalkDayOption = { day: buildDay({ id: 2, date: '2026-10-20' }), index: 1, start: '09:30' };

const schedule = (state: WalkScheduleState, anyHours = false): WalkSchedule => ({
  state,
  anyHours,
  byStation: new Map(),
});

const choice = (overrides: Partial<WalkDayChoice> = {}): WalkDayChoice => ({
  options: [monday, tuesday],
  day: tuesday,
  fixed: false,
  choose: vi.fn(),
  ...overrides,
});

const NO_DAY = 'Put the walk on a day with a start time to see arrivals and opening hours.';

beforeEach(() => resetAllStores());

describe('WalkDayLine', () => {
  it("lets another of the walk's days be picked from a menu, the one shown marked", () => {
    function Picker() {
      const [day, setDay] = useState<WalkDayOption>(tuesday);
      const pick = (id: number) => setDay(id === 1 ? monday : tuesday);
      return <WalkDayLine choice={choice({ day, choose: pick })} schedule={schedule('ready')} stationCount={3} />;
    }
    render(<Picker />);
    expect(screen.getByText('Times for')).toBeInTheDocument();
    const picker = screen.getByTestId('walk-day-picker');
    // The pill names the date the hours are for, as the menu does.
    expect(picker).toHaveTextContent(/^Day 2, Tue, Oct 20(, 2026)?, start 09:30$/);
    expect(picker).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(picker);
    expect(picker).toHaveAttribute('aria-expanded', 'true');
    const items = [...screen.getByRole('menu').querySelectorAll('button')];
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^Day 1, .*: Old town, no start time$/),
      expect.stringMatching(/^Day 2, .*, start 09:30$/),
    ]);
    expect(items.map((item) => !!item.querySelector('svg'))).toEqual([false, true]);
    fireEvent.click(screen.getByRole('button', { name: /^Day 1, / }));
    expect(screen.getByTestId('walk-day-picker')).toHaveTextContent(
      /^Day 1, Mon, Oct 19(, 2026)?: Old town, no start time$/
    );
  });

  it('closes the menu again from its pill', () => {
    render(<WalkDayLine choice={choice()} schedule={schedule('ready')} stationCount={3} />);
    const picker = screen.getByTestId('walk-day-picker');
    fireEvent.click(picker);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(picker);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('names the day alone where it is fixed or the only one', () => {
    const { rerender } = render(
      <WalkDayLine choice={choice({ fixed: true })} schedule={schedule('ready')} stationCount={3} />
    );
    expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 2, Tue, Oct 20(, 2026)?, start 09:30$/);
    expect(screen.queryByTestId('walk-day-picker')).not.toBeInTheDocument();
    rerender(
      <WalkDayLine
        choice={choice({ options: [monday], day: monday })}
        schedule={schedule('noStart')}
        stationCount={3}
      />
    );
    expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, .+: Old town, no start time$/);
    expect(screen.getByText('Give the walk a time on this day to see arrivals and opening hours.')).toBeInTheDocument();
  });

  it('says what is missing: a day once there are stops, a date', () => {
    const none = choice({ options: [], day: null });
    const { rerender, container } = render(<WalkDayLine choice={none} schedule={schedule('noDay')} stationCount={2} />);
    expect(screen.getByText(NO_DAY)).toBeInTheDocument();
    rerender(<WalkDayLine choice={none} schedule={schedule('noDay')} stationCount={1} />);
    expect(container).toBeEmptyDOMElement();
    // Opened from a day the walk has left: that day is not replaced, and nothing is asked.
    rerender(<WalkDayLine choice={{ ...none, fixed: true }} schedule={schedule('noDay')} stationCount={3} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<WalkDayLine choice={choice()} schedule={schedule('noDate')} stationCount={3} />);
    expect(screen.getByText('This day has no date, so arrivals and opening hours are left out.')).toBeInTheDocument();
  });

  it('names where the hours come from once there are any to go by, and nothing for another tour', () => {
    const { rerender, container } = render(
      <WalkDayLine choice={choice()} schedule={schedule('ready', true)} stationCount={3} />
    );
    expect(screen.getByText(/Opening hours from OpenStreetMap or the trip's places/)).toBeInTheDocument();
    rerender(<WalkDayLine choice={choice()} schedule={schedule('noRoute', true)} stationCount={3} />);
    expect(screen.queryByText(/Opening hours from OpenStreetMap/)).not.toBeInTheDocument();
    rerender(<WalkDayLine enabled={false} choice={choice()} schedule={schedule('ready', true)} stationCount={3} />);
    expect(container).toBeEmptyDOMElement();
  });
});
