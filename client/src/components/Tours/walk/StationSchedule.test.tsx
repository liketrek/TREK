// CW-04: a station's arrival, end of stay and opening hours as the planner and
// the walk's detail both show them.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { StationScheduleLine, StationScheduleRow } from './StationSchedule';
import type { StationSchedule, WalkSchedule } from './walkSchedule';

const at = (overrides: Partial<StationSchedule>): StationSchedule => ({
  arrival: 1040,
  atLeast: false,
  leave: 1100,
  fit: { kind: 'unknown' },
  ...overrides,
});

const line = (schedule: StationSchedule | undefined) =>
  render(<StationScheduleLine schedule={schedule} name="Lenbachhaus" />);

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { time_format: '24h' } });
});

describe('StationScheduleLine', () => {
  it('names station, arrival, end of stay and window for the card case: 17:20 to 18:20 against a closing at 18:00', () => {
    line(at({ fit: { kind: 'closes', source: 'osm', window: [600, 1080] } }));
    expect(screen.getByText('Arrival about 17:20, stay until 18:20')).toBeInTheDocument();
    expect(screen.getByTestId('walk-station-conflict')).toHaveTextContent(
      'Lenbachhaus closes at 18:00, during the stay from 17:20 to 18:20 (open 10:00 to 18:00)'
    );
    expect(screen.getByTestId('walk-hours-source')).toHaveTextContent('OpenStreetMap');
    expect(screen.getByText('Found with the stop on OpenStreetMap; it may be out of date.')).toBeInTheDocument();
  });

  it('follows the 12 hour format, a window to midnight included', () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    const { unmount } = line(at({ leave: 1130, fit: { kind: 'closes', source: 'place', window: [600, 1080] } }));
    expect(screen.getByText('Arrival about 5:20 PM, stay until 6:50 PM')).toBeInTheDocument();
    expect(screen.getByTestId('walk-station-conflict')).toHaveTextContent(
      'Lenbachhaus closes at 6:00 PM, during the stay from 5:20 PM to 6:50 PM (open 10:00 AM to 6:00 PM)'
    );
    expect(screen.getByTestId('walk-hours-source')).toHaveTextContent('Trip place');
    // In 12 hours a window to midnight ends at 12:00 AM, never at 24:00.
    unmount();
    line(at({ fit: { kind: 'open', source: 'place', window: [600, 1440] } }));
    expect(screen.getByText(/Open 10:00 AM to 12:00 AM/)).toBeInTheDocument();
  });

  it('shows the window an open station is checked against; one to midnight reads 24:00', () => {
    line(at({ fit: { kind: 'open', source: 'place', window: [600, 1440] } }));
    expect(screen.getByText(/Open 10:00 to 24:00/)).toBeInTheDocument();
    expect(screen.queryByTestId('walk-station-conflict')).not.toBeInTheDocument();
  });

  it('names a station closed at its arrival with the windows of the day, with and without a stay', () => {
    const fit = {
      kind: 'closed',
      source: 'osm',
      windows: [
        [600, 720],
        [840, 1080],
      ],
    } as const;
    const { unmount } = line(at({ arrival: 780, leave: 810, fit }));
    expect(screen.getByTestId('walk-station-conflict')).toHaveTextContent(
      'Lenbachhaus is closed at 13:00, the stay would last until 13:30; open 10:00 to 12:00, 14:00 to 18:00'
    );
    unmount();
    line(at({ arrival: 780, leave: null, fit }));
    expect(screen.getByText('Arrival about 13:00')).toBeInTheDocument();
    expect(screen.getByTestId('walk-station-conflict')).toHaveTextContent(
      'Lenbachhaus is closed at 13:00; open 10:00 to 12:00, 14:00 to 18:00'
    );
  });

  it('names a station closed all day, and a point only passed by its arrival alone', () => {
    line(at({ leave: 1040, fit: { kind: 'closedAllDay', source: 'osm' } }));
    expect(screen.getByText('Arrival about 17:20')).toBeInTheDocument();
    expect(screen.getByTestId('walk-station-conflict')).toHaveTextContent('Lenbachhaus is closed all day on this date');
  });

  it('for an arrival at the earliest, says the hours are not checked yet', () => {
    line(at({ atLeast: true, fit: { kind: 'uncertain', source: 'osm' } }));
    expect(screen.getByText('Arrival 17:20 at the earliest, stay until 18:20 or later')).toBeInTheDocument();
    expect(
      screen.getByText(/Opening hours not checked: a stay before this stop is not entered yet\./)
    ).toBeInTheDocument();
    const { container } = line(at({ atLeast: true, leave: null }));
    expect(container).toHaveTextContent('Arrival 17:20 at the earliest');
  });

  it('gives hours it cannot read back as written, and says nothing for hours not known', () => {
    const { unmount } = line(at({ fit: { kind: 'unread', text: 'PH off' } }));
    expect(screen.getByText('Opening hours not read here: PH off')).toBeInTheDocument();
    unmount();
    line(at({ fit: { kind: 'unknown' } }));
    expect(screen.getByTestId('walk-station-hours')).toHaveTextContent('Arrival about 17:20, stay until 18:20');
    expect(screen.queryByText(/Open/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('walk-hours-source')).not.toBeInTheDocument();
  });

  it('says an arrival after midnight is on the next day and is not checked', () => {
    line(at({ arrival: 1470, leave: 1500, fit: { kind: 'nextDay' } }));
    expect(
      screen.getByText('Arrival about 00:30 the next day; opening hours are not checked across midnight.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('walk-station-conflict')).not.toBeInTheDocument();
  });

  it('shows nothing without a schedule', () => {
    const { container } = line(undefined);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('StationScheduleRow', () => {
  const schedule: WalkSchedule = {
    state: 'ready',
    anyHours: true,
    byStation: new Map([['a', at({ fit: { kind: 'closedAllDay', source: 'osm' } })]]),
  };

  it("names the station by its own name, else the place's, else its number", () => {
    const { rerender } = render(
      <StationScheduleRow schedule={schedule} point={{ id: 'a', name: 'Museum' }} placeName="Square" number={2} />
    );
    expect(screen.getByTestId('walk-station-schedule')).toHaveTextContent('Museum is closed all day');
    rerender(<StationScheduleRow schedule={schedule} point={{ id: 'a' }} placeName="Square" number={2} />);
    expect(screen.getByTestId('walk-station-schedule')).toHaveTextContent('Square is closed all day');
    rerender(<StationScheduleRow schedule={schedule} point={{ id: 'a' }} placeName={undefined} number={2} />);
    expect(screen.getByTestId('walk-station-schedule')).toHaveTextContent('Stop 2 is closed all day');
  });

  it('shows nothing for a point the schedule has no station for', () => {
    render(<StationScheduleRow schedule={schedule} point={{ id: 'b' }} placeName={undefined} number={3} />);
    expect(screen.queryByTestId('walk-station-schedule')).not.toBeInTheDocument();
  });
});
