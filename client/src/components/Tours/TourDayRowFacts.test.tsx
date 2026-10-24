import type { TourListItem } from '@trek/shared';
import { Bike, Footprints, Mountain, Route } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paddleBench } from '../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useTourVisitStore } from '../../store/tourVisitStore';
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

  it('HOR-01: a ride with a recorded time shows the horseshoe beside its riding time', () => {
    render(<TourDayRowFacts tour={{ ...tour, tour_type: 'horse', max_hiking_difficulty: null }} />);
    const time = screen.getByTestId('trip-plan-tour-walking-time');
    expect(time.getAttribute('aria-label')).toMatch(/^Riding time/);
    expect(time.querySelector('.lucide-horseshoe')).toBeTruthy();
    expect(time.querySelector('.lucide-footprints')).toBeNull();
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

describe("CW-02 a city walk's time on its day row", () => {
  const walk: TourListItem = {
    ...tour,
    tour_type: 'walk',
    duration: 45,
    break_additional_minutes: 15,
    max_hiking_difficulty: null,
    station_count: 3,
    station_stay_minutes: 120,
    station_stays_unknown: 0,
  };

  it('shows the walking time and the stays as the planned total, its breaks left out', () => {
    render(<TourDayRowPills tour={walk} />);
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('2 h 45 min');
    expect(time).toHaveAccessibleName('Walking: 45 min, Stays: 2 h, Planned total duration: 2 h 45 min');
  });

  it('says the total is at least what is known while a stay is not entered', () => {
    render(<TourDayRowPills tour={{ ...walk, station_stay_minutes: 90, station_stays_unknown: 1 }} />);
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('≥ 2 h 15 min');
    expect(time).toHaveAccessibleName(
      'Walking: 45 min, Stays: at least 1 h 30 min, Planned total duration: at least 2 h 15 min'
    );
  });

  it('shows the same total among the facts of a phone row, and no breaks', () => {
    render(<TourDayRowFacts tour={{ ...walk, station_stay_minutes: 90, station_stays_unknown: 1 }} mobile />);
    expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('≥ 2 h 15 min');
    expect(screen.getByTestId('trip-plan-tour-walking-time')).toHaveAccessibleName('Walking: 45 min');
    expect(screen.queryByTestId('trip-plan-tour-breaks')).not.toBeInTheDocument();
  });
});

describe("CW-03 a city walk's progress among the facts of a day row", () => {
  const walk: TourListItem = { ...tour, tour_type: 'walk', max_hiking_difficulty: null, station_count: 5 };

  beforeEach(() =>
    useTourVisitStore.setState({
      tripId: '4',
      byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'skipped' } },
    })
  );

  it.each([false, true])('shows the stops visited on that day, a tap naming them whole (mobile=%s)', (mobile) => {
    const openRow = vi.fn();
    render(
      <div onClick={openRow}>
        <TourDayRowFacts tour={walk} assignmentId={9} mobile={mobile} />
      </div>
    );
    const progress = screen.getByTestId('plan-walk-progress');
    expect(progress).toHaveTextContent('1/5');
    expect(progress).toHaveAccessibleName('1 of 5 visited');
    fireEvent.click(progress);
    expect(screen.getByRole('note')).toHaveTextContent('1 of 5 visited');
    expect(openRow).not.toHaveBeenCalled();
  });

  it('shows none without a day, or before a stop of that day is marked', () => {
    render(
      <>
        <TourDayRowFacts tour={walk} mobile />
        <TourDayRowFacts tour={walk} assignmentId={10} mobile />
      </>
    );
    expect(screen.queryByTestId('plan-walk-progress')).not.toBeInTheDocument();
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

describe('TIME-01: the estimated time of an import on a row', () => {
  // 12 km, 300 m up and 500 m down, never timed by the planner: 4 h by DIN 33466.
  const imported: TourListItem = {
    ...tour,
    distance: 12,
    elevation_gain: 300,
    elevation_loss: 500,
    duration: null,
    break_additional_minutes: null,
    max_hiking_difficulty: null,
  };

  it('TIME-01-FE-001: a day-plan and list row shows the estimate marked as one, its words saying how it was worked out', () => {
    render(<TourDayRowPills tour={imported} compact />);
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('≈ 4 h');
    expect(time.getAttribute('aria-label')).toBe(
      'Estimated time: 4 h. Worked out from distance, ascent and descent by the hiking signpost rule (DIN 33466), without breaks.'
    );
  });

  it('TIME-01-FE-002: a total the travellers entered is the time shown, the estimate kept beside it in the words', () => {
    render(<TourDayRowPills tour={{ ...imported, planned_duration_minutes: 300 }} />);
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('5 h');
    expect(time).not.toHaveTextContent('≈');
    expect(time.getAttribute('aria-label')).toContain('Estimated time: 4 h');
  });

  it('TIME-01-FE-003: a phone row shows the estimate as a fact of its own, and an unknown one not at all', () => {
    const { unmount } = render(<TourDayRowFacts tour={imported} mobile />);
    expect(screen.getByTestId('trip-plan-tour-estimate')).toHaveTextContent('≈ 4 h');
    expect(screen.getByTestId('trip-plan-tour-estimate')).toHaveAccessibleName(/^Estimated time: 4 h\. Worked out/);
    expect(screen.queryByTestId('trip-plan-tour-walking-time')).not.toBeInTheDocument();
    unmount();
    render(<TourDayRowFacts tour={{ ...imported, elevation_gain: null, elevation_loss: null }} mobile />);
    expect(screen.queryByTestId('trip-plan-tour-estimate')).not.toBeInTheDocument();
  });

  it('TIME-01-FE-006: with a total the travellers entered a phone row shows that one time, the estimate in its words', () => {
    render(<TourDayRowFacts tour={{ ...imported, planned_duration_minutes: 300 }} mobile />);
    expect(screen.queryByTestId('trip-plan-tour-estimate')).not.toBeInTheDocument();
    const total = screen.getByTestId('trip-plan-tour-planned-duration');
    expect(total).toHaveTextContent('5 h');
    expect(total).not.toHaveTextContent('≈');
    expect(total.getAttribute('aria-label')).toMatch(/: 5 h\. Estimated time: 4 h\. Worked out/);
  });

  it('TIME-01-FE-004: a tour the planner timed shows its own time and no estimate', () => {
    render(<TourDayRowFacts tour={tour} />);
    expect(screen.queryByTestId('trip-plan-tour-estimate')).not.toBeInTheDocument();
    expect(screen.getByTestId('trip-plan-tour-walking-time')).toHaveAccessibleName('Walking time: 53 min');
  });
});
