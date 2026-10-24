import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useTripStore } from '../../store/tripStore';
import { TourScopeSummary } from './TourScopeSummary';
import { tourScopeSummary } from './tourScope';

function tour(over: Partial<TourListItem> & Pick<TourListItem, 'place_id'>): TourListItem {
  return {
    tour_type: 'hike',
    name: `Tour ${over.place_id}`,
    distance: null,
    elevation_gain: null,
    elevation_loss: null,
    duration: null,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: null,
    max_hiking_difficulty: 2,
    planned: false,
    caution: false,
    has_waypoints: true,
    origin: 'trek',
    ...over,
  } as TourListItem;
}

const HIKE_A = tour({
  place_id: 1,
  distance: 10,
  elevation_gain: 600,
  elevation_loss: 500,
  duration: 200,
  planned: true,
});
const HIKE_B = tour({
  place_id: 2,
  distance: 5.5,
  elevation_gain: null,
  elevation_loss: 100,
  duration: 100,
  break_additional_minutes: 30,
});
const GPX_HIKE = tour({
  place_id: 3,
  distance: 8,
  elevation_gain: 300,
  elevation_loss: 300,
  duration: 150,
  has_waypoints: false,
  origin: 'gpx',
});
const PADDLE = tour({
  place_id: 4,
  tour_type: 'kayak',
  distance: 12,
  elevation_gain: 40,
  elevation_loss: 40,
  duration: 180,
  planned: true,
});

describe('tourScopeSummary (STA-01)', () => {
  it('counts a tour on a day by the caller, once however many days it is on', () => {
    const scope = tourScopeSummary([HIKE_A, HIKE_B], (tour) => tour.place_id === 2);
    expect(scope.onDays).toBe(1);
    expect(scope.types[0].onDays).toBe(1);
  });

  it('counts each tour once, by type, the most tours first, with how many are on a day', () => {
    const scope = tourScopeSummary([HIKE_A, PADDLE, HIKE_B, GPX_HIKE, HIKE_A]);
    expect(scope.count).toBe(4);
    expect(scope.onDays).toBe(2);
    expect(scope.types.map((type) => [type.type, type.count, type.onDays])).toEqual([
      ['hike', 3, 1],
      ['kayak', 1, 1],
    ]);
  });

  it('ACT-01: leaves out a recording that is the actual track of a tour, so the tour is not counted twice', () => {
    const track = { ...GPX_HIKE, place_id: 9, activity_of: HIKE_A.place_id };
    const scope = tourScopeSummary([HIKE_A, track]);
    expect(scope.count).toBe(1);
    expect(scope.types[0].distanceKm).toEqual({ value: 10, known: 1, of: 1 });
  });

  it('sums what is known and says how much of the whole that is, never a zero for unknown', () => {
    const [hike] = tourScopeSummary([HIKE_A, HIKE_B, GPX_HIKE]).types;
    expect(hike.distanceKm).toEqual({ value: 23.5, known: 3, of: 3 });
    expect(hike.ascentM).toEqual({ value: 900, known: 2, of: 3 });
    const [none] = tourScopeSummary([tour({ place_id: 9 })]).types;
    expect(none.distanceKm).toEqual({ value: null, known: 0, of: 1 });
  });

  it('keeps the routed, the imported and the planned time apart', () => {
    const [hike] = tourScopeSummary([HIKE_A, HIKE_B, GPX_HIKE]).types;
    expect(hike.routedMinutes).toEqual({ value: 300, known: 2, of: 2 });
    expect(hike.importedMinutes).toEqual({ value: 150, known: 1, of: 1 });
    // Planned: each tour's own time plus its breaks (HIKE_B's 30 min).
    expect(hike.plannedMinutes).toEqual({ value: 480, known: 3, of: 3, atLeast: false });
  });

  it('CW-02: plans a city walk with its stays and no breaks, at least that much while a stay is not entered', () => {
    const walk = tour({
      place_id: 6,
      tour_type: 'walk',
      duration: 45,
      break_additional_minutes: 15,
      station_count: 3,
      station_stay_minutes: 120,
      station_stays_unknown: 0,
    });
    const [entered] = tourScopeSummary([walk]).types;
    expect(entered.plannedMinutes).toEqual({ value: 165, known: 1, of: 1, atLeast: false });
    const [open] = tourScopeSummary([walk, { ...walk, place_id: 7, station_stays_unknown: 1 }]).types;
    expect(open.plannedMinutes).toEqual({ value: 330, known: 2, of: 2, atLeast: true });
  });

  it('sums no heights for paddling, not even those a recorded paddle track brought', () => {
    const [paddle] = tourScopeSummary([PADDLE, { ...GPX_HIKE, place_id: 5, tour_type: 'kayak' }]).types;
    expect(paddle.ascentM).toEqual({ value: null, known: 0, of: 0 });
    expect(paddle.descentM).toEqual({ value: null, known: 0, of: 0 });
    expect(paddle.distanceKm.value).toBe(20);
  });
});

describe('TourScopeSummary', () => {
  beforeEach(() => {
    localStorage.clear();
    // The day lists say which tours are on a day: HIKE_B on two days, PADDLE on one; the flags say otherwise.
    useTripStore.setState({
      assignments: { 1: [{ place_id: 2 }], 2: [{ place_id: 2 }, { place_id: 4 }] },
    } as unknown as Parameters<typeof useTripStore.setState>[0]);
  });

  it('shows the counts and each type with its sums, an incomplete one marked as at least', () => {
    render(<TourScopeSummary tours={[HIKE_A, HIKE_B, PADDLE]} />);
    const counts = screen.getByTestId('tour-scope-counts');
    expect(counts).toHaveTextContent('3Tours');
    expect(counts).toHaveTextContent('2Planned');
    expect(counts).toHaveTextContent('1Unplanned');
    fireEvent.click(screen.getByTestId('tour-scope-toggle'));
    expect(screen.getByTestId('tour-scope-hike-distance')).toHaveTextContent('15.5 km');
    const ascent = screen.getByTestId('tour-scope-hike-ascent');
    expect(ascent).toHaveTextContent('≥ 600 m');
    expect(ascent).toHaveAccessibleName('Ascent: ≥ 600 m (known for 1 of 2 tours)');
    expect(screen.getByTestId('tour-scope-hike-routed')).toHaveAccessibleName('Routed time: 5 h');
    expect(screen.queryByTestId('tour-scope-hike-imported')).toBeNull();
    // Paddling sums no heights: no ascent badge, rather than 0 m.
    expect(screen.queryByTestId('tour-scope-kayak-ascent')).toBeNull();
    expect(screen.getByTestId('tour-scope-kayak-distance')).toHaveTextContent('12 km');
  });

  it('CW-02: marks a planned time whose city walk has a stay not entered as at least, and says so', () => {
    const walk = tour({
      place_id: 6,
      tour_type: 'walk',
      duration: 45,
      station_count: 3,
      station_stay_minutes: 90,
      station_stays_unknown: 1,
    });
    render(<TourScopeSummary tours={[walk]} />);
    fireEvent.click(screen.getByTestId('tour-scope-toggle'));
    const planned = screen.getByTestId('tour-scope-walk-planned');
    expect(planned).toHaveTextContent('≥ 2 h 15 min');
    expect(planned).toHaveAccessibleName('Planned with stays: at least 2 h 15 min');
  });

  it('starts folded to its counts, and remembers an opening in this browser', () => {
    const { unmount } = render(<TourScopeSummary tours={[HIKE_A]} />);
    expect(screen.queryByTestId('tour-scope-hike')).toBeNull();
    expect(screen.getByTestId('tour-scope-counts')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tour-scope-toggle'));
    expect(screen.getByTestId('tour-scope-hike')).toBeInTheDocument();
    unmount();
    render(<TourScopeSummary tours={[HIKE_A]} />);
    expect(screen.getByTestId('tour-scope-hike')).toBeInTheDocument();
    expect(screen.getByTestId('tour-scope-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows nothing for a trip without tours', () => {
    const { container } = render(<TourScopeSummary tours={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
