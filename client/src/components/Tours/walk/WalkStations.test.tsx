// CW-02, CW-03, CW-04: a city walk's stops in its detail, checked off for the
// day it was opened from, their arrivals and opening hours on the day looked
// at, and its progress as a pill of the desktop day row.
import type { TourDetailResponse, TourListItem, TourWaypoint } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../../../tests/helpers/factories';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { tourRepo } from '../../../repo/tourRepo';
import { tourVisitRepo } from '../../../repo/tourVisitRepo';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourVisitStore } from '../../../store/tourVisitStore';
import { useTripStore } from '../../../store/tripStore';
import type { Assignment, Day } from '../../../types';
import { ToastContainer } from '../../shared/Toast';
import { WalkProgressPill, WalkStationsCard } from './WalkStations';

const walk: TourListItem = {
  place_id: 42,
  name: 'Old town',
  tour_type: 'walk',
  distance: 0.3,
  elevation_gain: null,
  elevation_loss: null,
  duration: 20,
  break_additional_minutes: null,
  planned_duration_minutes: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  planned: true,
  caution: false,
  station_count: 3,
};

const waypoints: TourWaypoint[] = [
  {
    lat: 48,
    lng: 11,
    role: 'start',
    sequence: 0,
    key: 'stop-01',
    name: 'Museum',
    stay_minutes: 30,
    opening_hours: 'Mo-Fr 09:00-09:20',
  },
  { lat: 48.0005, lng: 11, role: 'via', sequence: 1, key: 'shape-01', shaping: true },
  { lat: 48.001, lng: 11, role: 'via', sequence: 2, key: 'stop-02', opening_hours: 'sunrise-sunset' },
  { lat: 48.002, lng: 11, role: 'end', sequence: 3, name: 'Cafe', stay_minutes: 15, opening_hours: 'Mo 10:00-18:00' },
];

const ROUTE: Array<[number, number]> = [
  [48, 11],
  [48.001, 11],
  [48.002, 11],
];

// 2026-10-19 is a Monday, 2026-10-20 a Tuesday.
const MONDAY = buildDay({ id: 7, trip_id: 4, date: '2026-10-19' });
const TUESDAY = buildDay({ id: 8, trip_id: 4, date: '2026-10-20' });
const ON_DAY = { id: 9, day_id: 7 };

/** The walk's entry on a day: its start that day, else the place's own time. */
function entry(dayId: number, time: string | null, placeTime: string | null = null): Assignment {
  return buildAssignment({
    id: dayId + 2,
    day_id: dayId,
    place_id: 42,
    assignment_time: time,
    place: buildPlace({ id: 42, place_time: placeTime }),
  });
}

/** The walk on Monday from 09:00, opened from that day. */
function onMonday(time: string | null = '09:00', day: Day = MONDAY) {
  return { assignment: ON_DAY, days: [day], assignments: { [String(day.id)]: [entry(day.id, time)] }, route: ROUTE };
}

function detail(points: TourWaypoint[] = waypoints): Promise<TourDetailResponse> {
  return Promise.resolve({ tour: walk, waypoints: points });
}

function card(props: Partial<Parameters<typeof WalkStationsCard>[0]> = {}) {
  return render(
    <>
      <ToastContainer />
      <WalkStationsCard tour={walk} tripId={4} assignment={ON_DAY} canMark {...props} />
    </>
  );
}

const UNREAD = 'The stops of this walk could not be loaded. Open it again while online to see them and check them off.';

const rowOf = async (name: string) =>
  (await screen.findAllByTestId('walk-station')).find((row) => row.textContent?.includes(name)) as HTMLElement;

beforeEach(() => {
  resetAllStores();
  useTourVisitStore.setState({ tripId: '4', byAssignment: {} });
  vi.spyOn(tourRepo, 'detail').mockImplementation(() => detail());
});

afterEach(() => vi.restoreAllMocks());

describe('WalkStationsCard', () => {
  it('shows nothing for a tour that is no city walk', () => {
    render(<WalkStationsCard tour={{ ...walk, tour_type: 'hike' }} tripId={4} assignment={ON_DAY} canMark />);
    expect(tourRepo.detail).not.toHaveBeenCalled();
    expect(screen.queryByTestId('walk-stations')).not.toBeInTheDocument();
  });

  it('says it is loading until the stops are read', () => {
    vi.mocked(tourRepo.detail).mockReturnValue(new Promise(() => undefined));
    card();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('lists the stops in their order without the shaping points, an unnamed one by its number', async () => {
    card();
    const rows = await screen.findAllByTestId('walk-station');
    expect(rows.map((row) => row.querySelector('.font-semibold')?.textContent)).toEqual(['Museum', 'Stop 2', 'Cafe']);
    expect(tourRepo.detail).toHaveBeenCalledWith(4, 42, expect.any(AbortSignal));
  });

  it('opened without a day, offers nothing to check off and says where to', async () => {
    card({ assignment: null });
    await screen.findAllByTestId('walk-station');
    expect(
      screen.getByText('Open the walk from a day of the plan to check its stops off for that day.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Mark visited')).not.toBeInTheDocument();
  });

  it('checks a stop off for its day and skips another, through the store', async () => {
    const update = vi
      .spyOn(tourVisitRepo, 'update')
      .mockResolvedValueOnce({ visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'visited' }] })
      .mockResolvedValueOnce({
        visits: [
          { assignment_id: 9, station_key: 'stop-01', status: 'visited' },
          { assignment_id: 9, station_key: 'stop-02', status: 'skipped' },
        ],
      });
    card();

    fireEvent.click(within(await rowOf('Museum')).getByText('Mark visited'));
    expect(update).toHaveBeenLastCalledWith(4, 9, 'stop-01', { status: 'visited' });
    expect(await within(await rowOf('Museum')).findByText('Visited on this day')).toBeInTheDocument();
    fireEvent.click(within(await rowOf('Stop 2')).getByText('Skip'));
    expect(update).toHaveBeenLastCalledWith(4, 9, 'stop-02', { status: 'skipped' });
    expect(await within(await rowOf('Stop 2')).findByText('Skipped on this day')).toBeInTheDocument();
  });

  it('a stop visited on that day says so and can be taken back', async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited' } } });
    const update = vi.spyOn(tourVisitRepo, 'update').mockResolvedValue({ visits: [] });
    card();

    const museum = await rowOf('Museum');
    expect(within(museum).getByText('Visited on this day')).toBeInTheDocument();
    fireEvent.click(within(museum).getByText('Take back'));

    expect(update).toHaveBeenCalledWith(4, 9, 'stop-01', { status: 'planned' });
  });

  it('a stop without a key has nothing to check off, and without the right to plan the day no stop has', async () => {
    const { unmount } = card();
    expect(within(await rowOf('Cafe')).queryByRole('button')).not.toBeInTheDocument();
    expect(within(await rowOf('Museum')).getByText('Mark visited')).toBeInTheDocument();
    unmount();

    card({ canMark: false });
    await screen.findAllByTestId('walk-station');
    expect(screen.queryByText('Mark visited')).not.toBeInTheDocument();
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });

  it('on a day put on the plan offline, says the stops wait for the sync and offers no buttons', async () => {
    card({ assignment: { id: -1700000000000, day_id: 7 } });
    await screen.findAllByTestId('walk-station');
    expect(
      screen.getByText('This walk was put on the day while offline. Its stops can be checked off once it has synced.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Mark visited')).not.toBeInTheDocument();
    expect(screen.queryByText('Open the walk from a day of the plan to check its stops off for that day.')).toBeNull();
  });

  it('a mark the server refuses is taken back and said in a toast', async () => {
    vi.spyOn(tourVisitRepo, 'update').mockRejectedValue(new Error('No permission'));
    card();

    fireEvent.click(within(await rowOf('Museum')).getByText('Mark visited'));

    expect(
      await screen.findByText('The stop could not be marked. Open the walk again and try once more.')
    ).toBeInTheDocument();
    expect(within(await rowOf('Museum')).getByText('Mark visited')).toBeInTheDocument();
  });

  it('heads the stops with how many were visited on that day', async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'skipped' } } });
    card();
    expect(await screen.findByText('1 of 3 visited')).toBeInTheDocument();
  });

  it('beside the count, says the walking time left from the last visit, and the stays apart in its tooltip (CW-13)', async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'visited' } } });
    card(onMonday());
    const pill = await screen.findByTestId('walk-remaining');
    expect(pill).toHaveTextContent('10 min left on foot');
    expect(pill).toHaveAttribute(
      'aria-label',
      'Walking time from Stop 2, the last stop visited, shared out along the route by distance. Stays are not in it. Stays still open: 15 min.'
    );
    expect(pill).not.toHaveClass('opacity-60');
  });

  it('dims the time left where it is not known, and says why (CW-13)', async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-02': 'visited' } } });
    card(onMonday());
    const unclear = await screen.findByTestId('walk-remaining');
    expect(unclear).toHaveTextContent('Order unclear');
    expect(unclear).toHaveClass('opacity-60');
    expect(unclear.getAttribute('aria-label')).toContain('Stops before Stop 2 are still open: Museum.');
  });

  it('without a route, says the time left is not known rather than the whole walk (CW-13)', async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited' } } });
    card();
    const pending = await screen.findByTestId('walk-remaining');
    expect(pending).toHaveTextContent('Time left unknown');
    expect(pending.getAttribute('aria-label')).toContain('The walk has no route yet, so the time left is not known.');
  });

  it('on the day it was opened from, shows each arrival, the end of each stay and what the opening hours say', async () => {
    card(onMonday());
    expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, .+, start 09:00$/);
    expect(screen.queryByTestId('walk-day-picker')).not.toBeInTheDocument();
    const museum = await rowOf('Museum');
    expect(within(museum).getByText('Arrival about 09:00, stay until 09:30')).toBeInTheDocument();
    expect(within(museum).getByTestId('walk-station-conflict')).toHaveTextContent(
      'Museum closes at 09:20, during the stay from 09:00 to 09:30 (open 09:00 to 09:20)'
    );
    expect(within(museum).getByTestId('walk-hours-source')).toHaveTextContent('OpenStreetMap');
    const unnamed = await rowOf('Stop 2');
    expect(within(unnamed).getByText('Arrival about 09:40')).toBeInTheDocument();
    expect(within(unnamed).getByText('Opening hours not read here: sunrise-sunset')).toBeInTheDocument();
    // The stay at stop 2 is not known, so the cafe's arrival is a lower bound and its hours are not judged.
    const cafe = await rowOf('Cafe');
    expect(within(cafe).getByText('Arrival 09:50 at the earliest, stay until 10:05 or later')).toBeInTheDocument();
    expect(
      within(cafe).getByText('Opening hours not checked: a stay before this stop is not entered yet.')
    ).toBeInTheDocument();
    expect(within(cafe).queryByTestId('walk-station-conflict')).not.toBeInTheDocument();
    expect(screen.getByText(/Opening hours from OpenStreetMap or the trip's places/)).toBeInTheDocument();
  });

  it("names a stop by the trip place it stands for and checks the place's own hours: 17:20 to 18:20 against 18:00", async () => {
    const week = JSON.stringify(
      Array.from({ length: 7 }, (_, day) =>
        day < 5 ? { closed: false, open: '10:00', close: '18:00' } : { closed: true }
      )
    );
    seedStore(useTripStore, { places: [buildPlace({ id: 77, name: 'Lenbachhaus', opening_hours: week })] });
    vi.mocked(tourRepo.detail).mockImplementation(() =>
      detail([
        { lat: 48, lng: 11, role: 'start', sequence: 0, key: 'stop-01', linked_place_id: 77, stay_minutes: 60 },
        { lat: 48.002, lng: 11, role: 'end', sequence: 1, key: 'stop-02', name: 'Cafe', stay_minutes: 0 },
      ])
    );
    card(onMonday('17:20'));

    const museum = await rowOf('Lenbachhaus');
    expect(within(museum).getByText('Arrival about 17:20, stay until 18:20')).toBeInTheDocument();
    expect(within(museum).getByTestId('walk-station-conflict')).toHaveTextContent(
      'Lenbachhaus closes at 18:00, during the stay from 17:20 to 18:20 (open 10:00 to 18:00)'
    );
    expect(within(museum).getByTestId('walk-hours-source')).toHaveTextContent('Trip place');
    expect(within(museum).getByText('Entered for this place of the trip.')).toBeInTheDocument();
    // Only passed, a stop without hours stays unknown: no window and nothing said to be open.
    const cafe = await rowOf('Cafe');
    expect(within(cafe).getByText('Arrival about 18:40')).toBeInTheDocument();
    expect(within(cafe).queryByText(/Open/)).not.toBeInTheDocument();
  });

  it('shows the times in the 12 hour format where the user chose it', async () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    card(onMonday());
    expect(within(await rowOf('Museum')).getByText('Arrival about 9:00 AM, stay until 9:30 AM')).toBeInTheDocument();
    expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, .+, start 9:00 AM$/);
  });

  it('on a day without a start, asks for one and leaves arrivals and hours unsaid', async () => {
    card(onMonday(null));
    expect(
      await screen.findByText('Give the walk a time on this day to see arrivals and opening hours.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, .+, no start time$/);
    await screen.findAllByTestId('walk-station');
    expect(screen.queryByText(/Arrival/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Opening hours from OpenStreetMap/)).not.toBeInTheDocument();
  });

  it('on a day without a date, says so and shows no arrival', async () => {
    card(onMonday('09:00', buildDay({ id: 7, trip_id: 4, date: null })));
    expect(
      await screen.findByText('This day has no date, so arrivals and opening hours are left out.')
    ).toBeInTheDocument();
    await screen.findAllByTestId('walk-station');
    expect(screen.queryByText(/Arrival/)).not.toBeInTheDocument();
  });

  it('without a route, shows no arrival', async () => {
    card({ ...onMonday(), route: null });
    await screen.findAllByTestId('walk-station');
    expect(screen.queryByText(/Arrival/)).not.toBeInTheDocument();
  });

  it('names no source of hours when no stop has any', async () => {
    vi.mocked(tourRepo.detail).mockImplementation(() =>
      detail(waypoints.map(({ opening_hours: _hours, ...point }) => point))
    );
    card(onMonday());
    expect(within(await rowOf('Museum')).getByText('Arrival about 09:00, stay until 09:30')).toBeInTheDocument();
    expect(screen.queryByText(/Opening hours from OpenStreetMap/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('walk-hours-source')).not.toBeInTheDocument();
  });

  it('opened from no day of the walk, takes the first with a start time, lets another be picked, and checks nothing off', async () => {
    card({
      assignment: null,
      days: [MONDAY, TUESDAY],
      assignments: { '7': [entry(7, null)], '8': [entry(8, null, '10:00')] },
      route: ROUTE,
    });
    const picker = screen.getByTestId('walk-day-picker');
    expect(picker).toHaveTextContent(/^Day 2, .+, start 10:00$/);
    // Tuesday from 10:00: the museum closed at 09:20 already.
    expect(within(await rowOf('Museum')).getByTestId('walk-station-conflict')).toHaveTextContent(
      'Museum is closed at 10:00, the stay would last until 10:30; open 09:00 to 09:20'
    );
    expect(screen.queryByText('Mark visited')).not.toBeInTheDocument();
    expect(
      screen.getByText('Open the walk from a day of the plan to check its stops off for that day.')
    ).toBeInTheDocument();

    fireEvent.click(picker);
    const monday = screen.getByRole('button', { name: /^Day 1, .*no start time$/ });
    fireEvent.click(monday);
    expect(screen.getByTestId('walk-day-picker')).toHaveTextContent(/^Day 1, .+, no start time$/);
    expect(screen.getByText('Give the walk a time on this day to see arrivals and opening hours.')).toBeInTheDocument();
    expect(screen.queryByText(/Arrival/)).not.toBeInTheDocument();
  });

  it('opened from no day while the walk is on none, asks to put it on one', async () => {
    card({ assignment: null });
    expect(
      await screen.findByText('Put the walk on a day with a start time to see arrivals and opening hours.')
    ).toBeInTheDocument();
  });

  it('reads the stops again once the walk was saved, keeping the ones shown until then', async () => {
    const view = render(<WalkStationsCard tour={{ ...walk, revision: 1 }} tripId={4} assignment={ON_DAY} canMark />);
    await screen.findAllByTestId('walk-station');
    vi.mocked(tourRepo.detail).mockImplementation(() => detail(waypoints.slice(0, 2)));
    view.rerender(<WalkStationsCard tour={{ ...walk, revision: 2 }} tripId={4} assignment={ON_DAY} canMark />);
    expect(screen.getAllByTestId('walk-station')).toHaveLength(3);
    await vi.waitFor(() => expect(screen.getAllByTestId('walk-station')).toHaveLength(1));
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
  });

  it('a walk whose stops cannot be read lists none, counts none and says so', async () => {
    vi.mocked(tourRepo.detail).mockRejectedValue(new Error('Tour not available offline'));
    card();
    expect(await screen.findByText(UNREAD)).toBeInTheDocument();
    expect(screen.queryAllByTestId('walk-station')).toEqual([]);
    expect(screen.queryByText(/visited/)).not.toBeInTheDocument();
  });

  it("offline, the route's two ends read in place of the stops are no stops: no count, and it says so", async () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'visited' } } });
    const ends: TourWaypoint[] = [
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.002, lng: 11, role: 'end', sequence: 1 },
    ];
    vi.mocked(tourRepo.detail).mockImplementation(() => detail(ends));
    card(onMonday());

    expect(await screen.findByText(UNREAD)).toBeInTheDocument();
    expect(screen.queryAllByTestId('walk-station')).toEqual([]);
    expect(screen.queryByText(/visited/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Arrival/)).not.toBeInTheDocument();
  });

  it('a walk saved offline lists its stops before the sync gave them keys', async () => {
    const unsaved = waypoints.map(({ key: _key, ...point }) => point);
    vi.mocked(tourRepo.detail).mockImplementation(() => detail(unsaved));
    card({ tour: { ...walk, place_id: -1700000000001 }, assignment: { id: -1700000000000, day_id: 7 } });

    expect(await screen.findAllByTestId('walk-station')).toHaveLength(3);
    expect(screen.getByText('0 of 3 visited')).toBeInTheDocument();
    expect(screen.queryByText(UNREAD)).not.toBeInTheDocument();
  });

  it('a walk without stops lists none and misses nothing', async () => {
    vi.mocked(tourRepo.detail).mockImplementation(() => detail([]));
    card({ tour: { ...walk, station_count: 0 } });
    await vi.waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    expect(screen.queryAllByTestId('walk-station')).toEqual([]);
    expect(screen.queryByText(UNREAD)).not.toBeInTheDocument();
    expect(screen.queryByText(/visited/)).not.toBeInTheDocument();
  });
});

describe('WalkProgressPill', () => {
  it('says nothing for a hike, a walk without stops, or a day without marks', () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited' } } });
    render(
      <>
        <WalkProgressPill tour={{ ...walk, tour_type: 'hike' }} assignmentId={9} />
        <WalkProgressPill tour={{ ...walk, station_count: 0 }} assignmentId={9} />
        <WalkProgressPill tour={walk} assignmentId={10} />
        <WalkProgressPill tour={walk} assignmentId={undefined} />
      </>
    );
    expect(screen.queryByTestId('plan-walk-progress')).not.toBeInTheDocument();
  });

  it('shows the visited stops of all of them, named in full', () => {
    useTourVisitStore.setState({
      byAssignment: { 9: { a1b2c3: 'visited', d4e5f6: 'visited', g7h8i9: 'skipped' }, 10: { a1b2c3: 'skipped' } },
    });
    render(
      <>
        <WalkProgressPill tour={{ ...walk, station_count: 5 }} assignmentId={9} />
        <WalkProgressPill tour={{ ...walk, station_count: 5 }} assignmentId={10} />
      </>
    );
    const [day9, day10] = screen.getAllByTestId('plan-walk-progress');
    expect(day9).toHaveTextContent('2/5');
    expect(day9).toHaveAccessibleName('2 of 5 visited');
    expect(day10).toHaveTextContent('0/5');
  });
});
