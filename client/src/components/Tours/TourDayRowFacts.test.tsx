import type { TourListItem } from '@trek/shared';
import { Bike, Footprints, Mountain, Route } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import TourDayRowFacts, { TourDayRowIcon } from './TourDayRowFacts';
import { tourDayRowIcon } from './tourDayRowIcon';

const tour: TourListItem = {
  place_id: 42,
  name: 'Ridge',
  tour_type: 'hike',
  distance: 4,
  elevation_gain: 100,
  elevation_loss: 80,
  duration: 53,
  break_additional_minutes: 10,
  planned_duration_minutes: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: true,
  caution: false,
};

describe('RC-01 Tour day-row facts', () => {
  it('selects controlled type icons without enabling any types', () => {
    expect(tourDayRowIcon('hike')).toBe(Mountain);
    expect(tourDayRowIcon('bike')).toBe(Bike);
    expect(tourDayRowIcon('walk')).toBe(Footprints);
    expect(tourDayRowIcon('unknown')).toBe(Route);
    render(<TourDayRowIcon type="hike" />);
    expect(screen.getByTestId('plan-tour-icon').querySelector('.lucide-mountain')).toBeTruthy();
  });

  it.each([false, true])('renders compact facts with accessible meaning (mobile=%s)', (mobile) => {
    render(<TourDayRowFacts tour={tour} mobile={mobile} />);
    expect(screen.getByTestId('plan-tour-distance')).toHaveTextContent('4');
    expect(screen.getByTestId('plan-tour-ascent')).toHaveTextContent('100');
    expect(screen.getByTestId('trip-plan-tour-walking-time')).toHaveAccessibleName('Walking time: 53 min');
    expect(screen.getByTestId('trip-plan-tour-breaks')).toHaveAccessibleName('Breaks / additional time: 10 min');
    expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('1 h 3 min');
    expect(screen.queryByText('80 m')).not.toBeInTheDocument();
  });

  it.each([null, 0])('omits missing metrics and empty breaks (%s)', (breaks) => {
    render(
      <TourDayRowFacts tour={{ ...tour, distance: null, elevation_gain: null, break_additional_minutes: breaks }} />
    );
    expect(screen.queryByTestId('plan-tour-distance')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plan-tour-ascent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trip-plan-tour-breaks')).not.toBeInTheDocument();
    expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('53 min');
  });

  it('supports hover, keyboard focus and touch help without opening the containing row', async () => {
    const openRow = vi.fn();
    render(
      <div onClick={openRow}>
        <TourDayRowFacts tour={tour} />
      </div>
    );
    const walking = screen.getByTestId('trip-plan-tour-walking-time');
    fireEvent.mouseEnter(walking);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Walking time: 53 min');
    fireEvent.mouseLeave(walking);
    const matches = vi.spyOn(walking, 'matches').mockImplementation((selector) => selector === ':focus-visible');
    fireEvent.focus(walking);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Walking time: 53 min');
    fireEvent.blur(walking);
    matches.mockRestore();
    fireEvent.click(walking);
    expect(screen.getByRole('note')).toHaveTextContent('Walking time: 53 min');
    expect(openRow).not.toHaveBeenCalled();
  });
});
