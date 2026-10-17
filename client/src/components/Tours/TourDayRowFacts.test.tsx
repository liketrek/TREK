import type { TourListItem } from '@trek/shared';
import { Bike, Footprints, Mountain, Route } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { paddleBench } from '../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import TourDayRowFacts, { TourDayRowIcon, TourDayRowPills } from './TourDayRowFacts';
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

describe('PAD-09 the check bench on a tour row', () => {
  const kayak: TourListItem = { ...tour, tour_type: 'kayak', paddle_check: paddleBench() };

  it('PCD-001: a kayak tour with a bench shows one checklist pill, its tooltip saying it is no clearance', () => {
    render(<TourDayRowPills tour={kayak} />);
    const pill = screen.getByTestId('plan-tour-paddle-check');
    expect(pill).toHaveTextContent('1 open');
    expect(pill.getAttribute('aria-label')).toContain('A checklist is no safety or legal clearance.');
  });

  it('PCD-002: an area without obstacle data shows no pill at all, never a count', () => {
    render(<TourDayRowPills tour={{ ...kayak, paddle_check: paddleBench({ data: 'none', open: 3 }) }} />);
    expect(screen.queryByTestId('plan-tour-paddle-check')).not.toBeInTheDocument();
  });

  it('PCD-002b: data that could not be read still shows, without a count', () => {
    render(<TourDayRowPills tour={{ ...kayak, paddle_check: paddleBench({ data: 'unavailable', open: 3 }) }} />);
    expect(screen.getByTestId('plan-tour-paddle-check')).not.toHaveTextContent('3');
  });

  it.each([false, true])('PCD-003: the day plan facts name the bench as one more fact (mobile=%s)', (mobile) => {
    render(<TourDayRowFacts tour={kayak} mobile={mobile} />);
    expect(screen.getByTestId('plan-tour-paddle-check')).toHaveAccessibleName('Checklist: 1 open');
  });

  const without: Array<[string, TourListItem]> = [
    ['a hike with a bench', { ...tour, paddle_check: paddleBench() }],
    ['a kayak tour without a bench', { ...tour, tour_type: 'kayak' }],
    ['a kayak tour whose bench is null', { ...tour, tour_type: 'kayak', paddle_check: null }],
  ];
  it.each(without)('PCD-004: %s shows no checklist pill and no checklist fact', (_case, item) => {
    render(
      <>
        <TourDayRowPills tour={item} />
        <TourDayRowFacts tour={item} />
      </>
    );
    expect(screen.queryByTestId('plan-tour-paddle-check')).not.toBeInTheDocument();
  });
});

describe('the compact facts of a tour list row', () => {
  const testIds = () =>
    [...document.querySelectorAll('[data-testid^="plan-tour"], [data-testid="trip-plan-tour-time"]')].map((el) =>
      el.getAttribute('data-testid')
    );
  const timed = { ...tour, distance: 4.2, elevation_gain: 478, planned_duration_minutes: 50 };

  it('PCD-005: a hike keeps time, distance and climbing, in that order', () => {
    render(<TourDayRowPills tour={timed} compact />);
    expect(testIds()).toEqual(['trip-plan-tour-time', 'plan-tour-distance', 'plan-tour-ascent']);
  });

  it('PCD-006: a paddle tour puts its check bench second and leaves out the climbing', () => {
    render(<TourDayRowPills tour={{ ...timed, tour_type: 'kayak', paddle_check: paddleBench() }} compact />);
    expect(testIds()).toEqual(['trip-plan-tour-time', 'plan-tour-paddle-check', 'plan-tour-distance']);
  });

  it('PCD-007: the day plan still shows every fact', () => {
    render(<TourDayRowPills tour={{ ...timed, tour_type: 'kayak', paddle_check: paddleBench() }} />);
    expect(testIds()).toEqual([
      'trip-plan-tour-time',
      'plan-tour-distance',
      'plan-tour-ascent',
      'plan-tour-paddle-check',
    ]);
  });
});
