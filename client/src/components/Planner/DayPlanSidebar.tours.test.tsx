// RS-01 / RC-01: how a Tour stop reads in the day plan while the Tours addon is on,
// and that it falls back to the plain Place row when it is off. The mocks are the
// ones DayPlanSidebar.test.tsx renders the sidebar with.
// CW-08: public transit between two city walks from the day plan's connector.
import userEvent from '@testing-library/user-event';
import type { TourListItem } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import {
  buildAssignment,
  buildDay,
  buildPlace,
  buildReservation,
  buildTrip,
  buildUser,
} from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Reservation } from '../../types';
import { tourPlannedTimes } from '../Tours/tourPresentation';
import DayPlanSidebar from './DayPlanSidebar';
// ── Hoisted mock state (accessible in vi.mock factories) ────────────────────
const mockDayNotesState = vi.hoisted(() => ({
  noteUi: {} as Record<string, unknown>,
  dayNotes: {} as Record<string, unknown[]>,
  setNoteUi: vi.fn(),
  noteInputRef: { current: null } as { current: null },
  openAddNote: vi.fn(),
  openEditNote: vi.fn(),
  cancelNote: vi.fn(),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  moveNote: vi.fn(),
}));

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>();
  return {
    ...actual,
    assignmentsApi: {
      reorder: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue({}),
      updateTime: vi.fn().mockResolvedValue({}),
      updateTransport: vi.fn().mockResolvedValue({}),
    },
    reservationsApi: {
      list: vi.fn().mockResolvedValue({ reservations: [] }),
      updatePositions: vi.fn().mockResolvedValue({}),
    },
    daysApi: {
      ...actual.daysApi,
      updateTransport: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock('../PDF/TripPDF', () => ({ downloadTripPDF: vi.fn().mockResolvedValue(undefined) }));

vi.mock('../Map/RouteCalculator', () => ({
  calculateRoute: vi.fn().mockResolvedValue({ distanceText: '5 km', durationText: '1h', coordinates: [] }),
  generateGoogleMapsUrl: vi.fn().mockReturnValue('https://maps.google.com/...'),
  generateCoMapsUrl: vi.fn().mockReturnValue('https://comaps.at/...'),
  optimizeRoute: vi.fn().mockImplementation((places) => places),
  // One leg per waypoint gap, carrying its two ends as the real one does; the connector between two stops reads distanceText.
  calculateRouteWithLegs: vi.fn().mockImplementation((waypoints: { lat: number; lng: number }[] = []) =>
    Promise.resolve({
      distanceText: '2 km',
      durationText: '10 min',
      legs: waypoints.slice(1).map((to, index) => ({
        from: [waypoints[index]?.lat, waypoints[index]?.lng],
        to: [to.lat, to.lng],
        distanceText: '2 km',
        durationText: '10 min',
        drivingText: '10 min',
        walkingText: '25 min',
      })),
    })
  ),
}));

// CW-08: a walk's stops are read for the names of a transit leg's two ends.
const mockTourDetail = vi.hoisted(() => vi.fn());
vi.mock('../../repo/tourRepo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../repo/tourRepo')>();
  return { ...actual, tourRepo: { ...actual.tourRepo, detail: mockTourDetail } };
});

// PlaceAvatar needs IntersectionObserver
class MockIO {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
beforeAll(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIO;
});

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
}));

vi.mock('../../hooks/useDayNotes', () => ({
  useDayNotes: () => mockDayNotesState,
}));

vi.mock('../Weather/WeatherWidget', () => ({
  default: (props: { locationName?: string | null }) => (
    <span data-testid="weather-widget" data-location={props.locationName ?? ''} />
  ),
}));

// A stable toast object so tests can assert on the messages the sidebar raises.
const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() }));

vi.mock('../shared/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../store/permissionsStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/permissionsStore')>()),
  useCanDo: () => () => true,
}));

const trip = buildTrip({ id: 1, currency: 'EUR' });

function makeDefaultProps(overrides = {}) {
  return {
    tripId: 1,
    trip,
    days: [],
    places: [],
    categories: [],
    assignments: {},
    selectedDayId: null,
    selectedPlaceId: null,
    selectedAssignmentId: null,
    onSelectDay: vi.fn(),
    onPlaceClick: vi.fn(),
    onDayDetail: vi.fn(),
    accommodations: [],
    onReorder: vi.fn(),
    onUpdateDayTitle: vi.fn(),
    onRouteCalculated: vi.fn(),
    onAssignToDay: vi.fn(),
    onRemoveAssignment: vi.fn(),
    onEditPlace: vi.fn(),
    onDeletePlace: vi.fn(),
    reservations: [],
    onAddReservation: vi.fn(),
    onNavigateToFiles: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  Element.prototype.scrollTo = vi.fn();
  sessionStorage.clear();
  localStorage.clear();
  clearExchangeRateCache();
  server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])));
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  seedStore(useSettingsStore, { settings: { time_format: '24h', temperature_unit: 'celsius' } } as never);
});

describe('DayPlanSidebar', () => {
  it('RS-01: previews a Tour description on one line like every stop, marked only while Tours is enabled', () => {
    const description = 'A long description of the ridge route, the lake overlook, and the return path.';
    const place = buildPlace({ id: 45, name: 'Ridge walk', description, tour_place_id: 45 });
    const day = buildDay({ id: 10, date: '2025-06-01', title: 'Day 1' });
    const assignment = buildAssignment({ id: 101, day_id: 10, order_index: 0, place });
    const times = {
      walkingMinutes: 60,
      breakMinutes: 35,
      plannedTotalMinutes: 95,
      manuallyOverridden: false,
      walk: null,
      atLeast: false,
      estimate: null,
    };
    const props = makeDefaultProps({
      days: [day],
      places: [place],
      tourPlaceIds: new Set([place.id]),
      plannedTourDurations: new Map([[place.id, times]]),
      assignments: { '10': [assignment] },
    });
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: true }] });
    const view = render(<DayPlanSidebar {...props} />);
    const tourPreview = view.container.querySelector('[data-testid="trip-plan-tour-description"]') as HTMLElement;
    expect(tourPreview).toHaveTextContent(description);
    // One line like the row's name, so hover controls make the description give way instead of wrapping.
    expect(tourPreview).toHaveStyle({ whiteSpace: 'nowrap', maxHeight: '1.3em' });
    expect(tourPreview.parentElement).toHaveClass('flex-nowrap', 'overflow-hidden');
    expect(screen.getByTestId('trip-plan-tour-walking-time')).toHaveTextContent('Walk: 1 h');
    expect(screen.getByTestId('trip-plan-tour-breaks')).toHaveTextContent('Breaks: 35 min');
    expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('Planned: 1 h 35 min');

    view.rerender(
      <DayPlanSidebar
        {...{
          ...props,
          plannedTourDurations: new Map([[place.id, { ...times, plannedTotalMinutes: 125, manuallyOverridden: true }]]),
        }}
      />
    );
    expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('Manual override');

    // CW-02: a city walk whose stay is not entered yet plans at least its known total.
    view.rerender(
      <DayPlanSidebar
        {...{
          ...props,
          plannedTourDurations: new Map([
            [place.id, { ...times, breakMinutes: null, plannedTotalMinutes: 135, atLeast: true }],
          ]),
        }}
      />
    );
    const walkTotal = screen.getByTestId('trip-plan-tour-planned-duration');
    expect(walkTotal).toHaveTextContent('Planned: ≥ 2 h 15 min');
    expect(walkTotal).toHaveAccessibleName('Planned total duration: at least 2 h 15 min');
    expect(screen.queryByTestId('trip-plan-tour-breaks')).not.toBeInTheDocument();

    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: false }] });
    view.rerender(<DayPlanSidebar {...props} />);
    expect(view.container.querySelector('[data-testid="trip-plan-tour-description"]')).toBeNull();
    expect(view.container.querySelector('[data-testid="trip-plan-tour-planned-duration"]')).toBeNull();
    expect(screen.getByText(description).closest('.collab-note-md')).toHaveStyle({
      whiteSpace: 'nowrap',
      maxHeight: '1.3em',
    });
  });

  it('RC-01: uses facet type and compact facts only for Tours, preserving Tours-off Place presentation', () => {
    const place = buildPlace({ id: 45, name: 'Ridge walk', description: 'Above the lake', tour_place_id: 45 });
    const day = buildDay({ id: 10, title: 'Day 1' });
    const assignment = buildAssignment({ id: 101, day_id: 10, order_index: 0, place });
    const tour = {
      place_id: 45,
      name: place.name,
      tour_type: 'hike' as const,
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
    const props = makeDefaultProps({
      days: [day],
      places: [place],
      tourPlaceIds: new Set([45]),
      assignments: { '10': [assignment] },
      plannedTourDurations: new Map([
        [45, { tour, walkingMinutes: 53, breakMinutes: 10, plannedTotalMinutes: 63, manuallyOverridden: false }],
      ]),
    });
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: true }] });
    const view = render(<DayPlanSidebar {...props} />);
    // The tile carries the grade, as in the tour lists; the facts sit in the plan's white badges.
    expect(screen.getByTestId('plan-tour-icon')).toHaveTextContent('T2');
    expect(screen.getByTestId('plan-tour-distance')).toHaveTextContent('4');
    expect(screen.getByTestId('plan-tour-ascent')).toHaveTextContent('100');
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('1 h 3 min');
    expect(time).toHaveAccessibleName(
      'Walking time: 53 min, Breaks / additional time: 10 min, Planned total duration: 1 h 3 min'
    );
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: false }] });
    view.rerender(<DayPlanSidebar {...props} />);
    expect(screen.queryByTestId('plan-tour-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plan-tour-facts')).not.toBeInTheDocument();
  });
  it('RC-01: an imported tour without a grade shows its type on the tile', () => {
    const place = buildPlace({ id: 46, name: 'Recorded loop', tour_place_id: 46 });
    const day = buildDay({ id: 10, title: 'Day 1' });
    const assignment = buildAssignment({ id: 102, day_id: 10, order_index: 0, place });
    const tour = {
      place_id: 46,
      name: place.name,
      tour_type: 'hike' as const,
      distance: 6,
      elevation_gain: 300,
      elevation_loss: 300,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: null,
      planned: true,
      caution: false,
      has_waypoints: false,
    };
    const props = makeDefaultProps({
      days: [day],
      places: [place],
      tourPlaceIds: new Set([46]),
      assignments: { '10': [assignment] },
      plannedTourDurations: new Map([
        [46, { tour, walkingMinutes: null, breakMinutes: null, plannedTotalMinutes: null, manuallyOverridden: false }],
      ]),
    });
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: true }] });
    render(<DayPlanSidebar {...props} />);

    expect(screen.getByTestId('plan-tour-icon').querySelector('.lucide-mountain')).toBeTruthy();
    // TIME-01: without a time of its own the import shows its estimate, worked out from its measures.
    const time = screen.getByTestId('trip-plan-tour-time');
    expect(time).toHaveTextContent('≈ 2 h 21 min');
    expect(time).toHaveAccessibleName(expect.stringContaining('Estimated time: 2 h 21 min'));
  });

  it('RC-01: a tour row offers no booking, a tour is not booked', () => {
    const place = buildPlace({ id: 45, name: 'Ridge walk', tour_place_id: 45 });
    const cafe = buildPlace({ id: 47, name: 'Lakeside cafe' });
    const day = buildDay({ id: 10, title: 'Day 1' });
    const assignments = {
      '10': [
        buildAssignment({ id: 101, day_id: 10, order_index: 0, place }),
        buildAssignment({ id: 103, day_id: 10, order_index: 1, place: cafe }),
      ],
    };
    const props = makeDefaultProps({
      days: [day],
      places: [place, cafe],
      tourPlaceIds: new Set([45]),
      assignments,
      onAddBookingToAssignment: vi.fn(),
    });
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: true }] });
    render(<DayPlanSidebar {...props} />);

    // The cafe can be booked; the tour beside it cannot.
    expect(screen.getAllByRole('button', { name: 'Add booking' })).toHaveLength(1);
  });
});

// CW-08: the old town walk ends at the bridge, the harbour walk starts at the fish market.
const TOURS_ON = [{ id: 'tours', name: 'Tours', type: 'trip', icon: '', enabled: true }];
const oldTown = buildPlace({
  id: 51,
  name: 'Old town',
  tour_place_id: 51,
  lat: 52.52,
  lng: 13.4,
  route_geometry: '[[52.52,13.4],[52.515,13.41],[52.51,13.42]]',
});
const harbour = buildPlace({
  id: 52,
  name: 'Harbour',
  tour_place_id: 52,
  lat: 52.5,
  lng: 13.45,
  route_geometry: '[[52.5,13.45],[52.49,13.46]]',
});
const cafe = buildPlace({ id: 53, name: 'Corner cafe', lat: 52.48, lng: 13.47 });

function walkTour(place: { id: number; name: string }, overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: place.id,
    name: place.name,
    tour_type: 'walk',
    distance: 3,
    elevation_gain: null,
    elevation_loss: null,
    duration: 90,
    break_additional_minutes: null,
    planned_duration_minutes: null,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: null,
    planned: true,
    caution: false,
    station_count: 2,
    station_stay_minutes: 45,
    station_stays_unknown: 0,
    ...overrides,
  } as TourListItem;
}

function walkDayProps(extra: {
  reservations?: Reservation[];
  withCafe?: boolean;
  onPlanTransitLeg?: () => void;
  firstWalk?: Partial<TourListItem>;
}) {
  const day = buildDay({ id: 10, date: '2025-06-01', title: 'Day 1' });
  const assignments = {
    '10': [
      buildAssignment({
        id: 201,
        day_id: 10,
        order_index: 0,
        tour_place_id: 51,
        place: { ...oldTown, place_time: '10:00' },
      }),
      buildAssignment({
        id: 202,
        day_id: 10,
        order_index: 1,
        tour_place_id: 52,
        place: { ...harbour, place_time: '13:00' },
      }),
      ...(extra.withCafe ? [buildAssignment({ id: 203, day_id: 10, order_index: 2, place: cafe })] : []),
    ],
  };
  const tours = [walkTour(oldTown, extra.firstWalk), walkTour(harbour)];
  return makeDefaultProps({
    days: [day],
    places: [oldTown, harbour, cafe],
    assignments,
    selectedDayId: 10,
    routeShown: true,
    tourPlaceIds: new Set([51, 52]),
    plannedTourDurations: new Map(tours.map((tour) => [tour.place_id, { ...tourPlannedTimes(tour), tour }])),
    reservations: extra.reservations ?? [],
    onPlanTransitLeg: extra.onPlanTransitLeg,
  });
}

/** A journey saved from the old town walk's end to the harbour walk's start, arriving at `arrives`. */
function savedJourney(arrives: string): Reservation {
  return {
    ...buildReservation({
      id: 300,
      type: 'transit',
      title: 'Old bridge → Fish market',
      reservation_time: '2025-06-01T12:20',
      reservation_end_time: `2025-06-01T${arrives}`,
      day_id: 10,
    }),
    endpoints: [
      {
        role: 'from',
        sequence: 0,
        name: 'Old bridge',
        lat: 52.51,
        lng: 13.42,
        local_date: '2025-06-01',
        local_time: '12:20',
      },
      {
        role: 'to',
        sequence: 1,
        name: 'Fish market',
        lat: 52.5,
        lng: 13.45,
        local_date: '2025-06-01',
        local_time: arrives,
      },
    ],
    metadata: {
      transit: {
        provider: 'transitous',
        duration: 1800,
        transfers: 0,
        legs: [{ mode: 'TRAM', line: 'M1', duration: 1500 }],
      },
    },
  } as unknown as Reservation;
}

function contextMenu() {
  return within(document.querySelector('[style*="z-index: 999999"]') as HTMLElement);
}

describe('DayPlanSidebar, public transit between two city walks (CW-08)', () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: TOURS_ON });
    mockTourDetail.mockImplementation((_tripId: number, placeId: number) =>
      Promise.resolve({
        tour: walkTour(placeId === 51 ? oldTown : harbour),
        waypoints:
          placeId === 51
            ? [
                { lat: 52.52, lng: 13.4, role: 'start', sequence: 0, key: 'a1', name: 'Town hall', stay_minutes: 30 },
                { lat: 52.51, lng: 13.42, role: 'end', sequence: 1, key: 'a2', name: 'Old bridge', stay_minutes: 15 },
              ]
            : [
                { lat: 52.5, lng: 13.45, role: 'start', sequence: 0, key: 'b1', name: 'Fish market' },
                { lat: 52.49, lng: 13.46, role: 'end', sequence: 1, key: 'b2', name: 'Lighthouse' },
              ],
      })
    );
  });

  it('CW-08: the connector between two walks opens the search from the last stop to the first, when the first walk ends', async () => {
    const user = userEvent.setup();
    const onPlanTransitLeg = vi.fn();
    render(<DayPlanSidebar {...walkDayProps({ onPlanTransitLeg })} />);

    await user.click(await screen.findByLabelText('Change travel mode'));
    await user.click(contextMenu().getByRole('button', { name: 'Public transit' }));

    // The walk's end at 10:00 plus 90 min walking and 45 min of stays; nothing is saved.
    await waitFor(() =>
      expect(onPlanTransitLeg).toHaveBeenCalledWith({
        dayId: 10,
        from: { name: 'Old bridge', lat: 52.51, lng: 13.42 },
        to: { name: 'Fish market', lat: 52.5, lng: 13.45 },
        time: '12:15',
        walk: {
          dayId: 10,
          fromWalk: 'Old town',
          toWalk: 'Harbour',
          ends: '12:15',
          endsNextDay: false,
          endsAtLeast: false,
          nextStarts: '13:00',
        },
      })
    );
    expect(mockTourDetail).toHaveBeenCalledTimes(2);
  });

  it('CW-08: a leg from a walk to a place keeps the search as for any leg, and reads no stops', async () => {
    const user = userEvent.setup();
    const onPlanTransitLeg = vi.fn();
    render(<DayPlanSidebar {...walkDayProps({ onPlanTransitLeg, withCafe: true })} />);

    const connectors = await screen.findAllByLabelText('Change travel mode');
    expect(connectors).toHaveLength(2);
    await user.click(connectors[1]);
    await user.click(contextMenu().getByRole('button', { name: 'Public transit' }));

    expect(onPlanTransitLeg).toHaveBeenCalledWith({
      dayId: 10,
      from: { name: '', lat: 52.49, lng: 13.46 },
      to: { name: 'Corner cafe', lat: 52.48, lng: 13.47 },
      time: null,
    });
    expect(mockTourDetail).not.toHaveBeenCalled();
  });

  it('CW-08: a journey saved at the walks’ ends adds no walk of nothing on either side of it', async () => {
    render(<DayPlanSidebar {...walkDayProps({ withCafe: true, reservations: [savedJourney('12:50')] })} />);

    // The only leg left is the one from the harbour walk to the cafe; the journey covers the rest.
    await screen.findByLabelText('Change travel mode');
    expect(screen.getAllByLabelText('Change travel mode')).toHaveLength(1);
    expect(screen.queryByTestId('transit-walk-late')).not.toBeInTheDocument();
  });

  it('CW-08: a saved journey that now arrives after the next walk starts says so, and changes nothing', () => {
    const onPlanTransitLeg = vi.fn();
    render(<DayPlanSidebar {...walkDayProps({ onPlanTransitLeg, reservations: [savedJourney('13:10')] })} />);

    expect(screen.getByTestId('transit-walk-late')).toHaveTextContent('Arrives after Harbour starts at 13:00');
    expect(onPlanTransitLeg).not.toHaveBeenCalled();
  });

  it('TIME-02-017: a tour with a start shows its end worked out from its time, and nothing runs over', () => {
    render(<DayPlanSidebar {...walkDayProps({})} />);

    const ends = screen.getAllByTestId('tour-day-end-worked-out');
    expect(ends[0]).toHaveTextContent('12:15');
    expect(ends[0]).toHaveAccessibleName('Ends at 12:15, worked out from the start and the tour time of 2 h 15 min');
    expect(screen.queryByTestId('tour-day-overrun')).not.toBeInTheDocument();
  });

  it('TIME-02-018: an end that runs past the start of the next timed item is said under the tour, nothing moved', () => {
    render(<DayPlanSidebar {...walkDayProps({ firstWalk: { planned_duration_minutes: 240 } })} />);

    expect(screen.getAllByTestId('tour-day-end-worked-out')[0]).toHaveTextContent('14:00');
    expect(screen.getByTestId('tour-day-overrun')).toHaveTextContent('Ends at 14:00, after Harbour starts at 13:00');
  });
});
