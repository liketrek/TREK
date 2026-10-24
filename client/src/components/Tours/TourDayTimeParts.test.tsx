// TIME-02-011 to TIME-02-016, TIME-02-021 and TIME-02-022: how the day plan says a tour's time, its overrun and the hint below its time fields.
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import { seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { TourDayTimeText, TourEndHint, TourOverrunLine } from './TourDayTimeParts';
import { workedOutEndHint } from './tourDayTimeHint';

const tour: TourListItem = {
  place_id: 7,
  name: 'Ridge',
  tour_type: 'hike',
  distance: 8,
  elevation_gain: 300,
  elevation_loss: 300,
  duration: 150,
  planned_duration_minutes: null,
  break_additional_minutes: 30,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: true,
  caution: false,
};
const imported: TourListItem = {
  ...tour,
  distance: 12,
  elevation_loss: 500,
  duration: null,
  break_additional_minutes: null,
};
const t = (key: string, params?: Record<string, unknown>) => `${key} ${JSON.stringify(params ?? {})}`;
const clock = (value: string) => value;

beforeEach(() => {
  seedStore(useSettingsStore, { settings: { time_format: '24h' } });
});

describe('TourDayTimeText', () => {
  it('TIME-02-011: a worked-out end is set apart and says how it was worked out', () => {
    render(<TourDayTimeText entry={{ start: '09:00', end: null }} tour={tour} />);
    const end = screen.getByTestId('tour-day-end-worked-out');
    expect(end).toHaveTextContent('12:00');
    expect(end).toHaveClass('text-content-faint');
    expect(end).toHaveAccessibleName('Ends at 12:00, worked out from the start and the tour time of 3 h');
  });

  it('TIME-02-012: an estimate is marked with ≈, a phone row uses its own tone, and past midnight says +1', () => {
    const { unmount } = render(<TourDayTimeText entry={{ start: '09:00', end: null }} tour={imported} mobile />);
    expect(screen.getByTestId('tour-day-end-worked-out')).toHaveTextContent('≈ 13:00');
    expect(screen.getByTestId('tour-day-end-worked-out')).toHaveClass('text-m-faint');
    unmount();
    render(<TourDayTimeText entry={{ start: '22:30', end: null }} tour={tour} />);
    expect(screen.getByTestId('tour-day-end-worked-out')).toHaveTextContent('01:30 +1');
    expect(screen.getByTestId('tour-day-end-worked-out')).toHaveAccessibleName(
      'Ends at 01:30 on the next day, worked out from the start and the tour time of 3 h'
    );
  });

  it('TIME-02-013: an end typed by hand shows as typed, and without an end only the start shows', () => {
    const { container, unmount } = render(<TourDayTimeText entry={{ start: '09:00', end: '15:00' }} tour={tour} />);
    expect(container).toHaveTextContent('09:00 → 15:00');
    expect(screen.queryByTestId('tour-day-end-worked-out')).not.toBeInTheDocument();
    unmount();
    const unknown = { ...imported, elevation_gain: null, elevation_loss: null };
    const plain = render(<TourDayTimeText entry={{ start: '09:00', end: null }} tour={unknown} />);
    expect(plain.container.textContent).toBe('09:00');
  });

  it('TIME-02-021: a city walk with a stay nobody entered ends then at the earliest, marked with ≥', () => {
    // 2 h 15 min on foot and 1 h of stays entered, one station of four without one.
    const walk: TourListItem = {
      ...tour,
      tour_type: 'walk',
      duration: 135,
      max_hiking_difficulty: null,
      station_count: 4,
      station_stay_minutes: 60,
      station_stays_unknown: 1,
    };
    render(<TourDayTimeText entry={{ start: '09:00', end: null }} tour={walk} />);
    const end = screen.getByTestId('tour-day-end-worked-out');
    expect(end).toHaveTextContent('≥ 12:15');
    expect(end).toHaveAccessibleName('Ends at 12:15, worked out from the start and the tour time of ≥ 3 h 15 min');
  });

  it('TIME-02-022: in a right-to-left language the arrow points from the start on the right to the end', () => {
    seedStore(useSettingsStore, { settings: { time_format: '24h', language: 'ar' } });
    const { container, unmount } = render(<TourDayTimeText entry={{ start: '09:00', end: '15:00' }} tour={tour} />);
    expect(container.textContent).toBe('09:00 ← 15:00');
    unmount();
    const worked = render(<TourDayTimeText entry={{ start: '09:00', end: null }} tour={tour} />);
    expect(worked.container).toHaveTextContent('09:00 ← 12:00');
    expect(worked.container.textContent).not.toContain('→');
  });
});

describe('TourOverrunLine', () => {
  it('TIME-02-014: names the item the end runs into, and says nothing without one', () => {
    const { container, unmount } = render(<TourOverrunLine overrun={null} />);
    expect(container).toBeEmptyDOMElement();
    unmount();
    render(<TourOverrunLine overrun={{ name: 'Lunch', time: '12:00', end: '13:00' }} />);
    expect(screen.getByTestId('tour-day-overrun')).toHaveTextContent('Ends at 13:00, after Lunch starts at 12:00');
  });

  it('TIME-02-014b: an item without a name is called the next item', () => {
    render(<TourOverrunLine overrun={{ name: '', time: '12:00', end: '13:00' }} />);
    expect(screen.getByTestId('tour-day-overrun')).toHaveTextContent(
      'Ends at 13:00, after the next item starts at 12:00'
    );
  });
});

describe('workedOutEndHint', () => {
  it('TIME-02-015: says the worked-out end while none is typed, and that a start will set one', () => {
    expect(workedOutEndHint({ start: '09:00', end: '' }, imported, t, clock)).toBe(
      'tours.dayTime.formHint {"time":"13:00","total":"≈ 4 h"}'
    );
    expect(workedOutEndHint({ start: '', end: '' }, tour, t, clock)).toBe('tours.dayTime.formNoStart {"total":"3 h"}');
  });

  it('TIME-02-016: says nothing for a typed end, a stage day, a plain place or a tour without a known time', () => {
    expect(workedOutEndHint({ start: '09:00', end: '15:00' }, tour, t, clock)).toBeNull();
    expect(workedOutEndHint({ start: '09:00', end: '', stageKey: 'stop-2' }, tour, t, clock)).toBeNull();
    expect(workedOutEndHint({ start: '09:00', end: '' }, null, t, clock)).toBeNull();
    const unknown = { ...imported, elevation_gain: null, elevation_loss: null };
    expect(workedOutEndHint({ start: '09:00', end: '' }, unknown, t, clock)).toBeNull();
    expect(workedOutEndHint({ start: '', end: '' }, unknown, t, clock)).toBeNull();
    render(<TourEndHint start="09:00" end="" assignment={{ tour_stage_key: null }} tour={tour} />);
    expect(screen.getByTestId('tour-day-end-hint')).toHaveTextContent('12:00');
  });
});
