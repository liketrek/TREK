// RS-01 / RC-01: how a Tour stop reads in the day plan while the Tours addon is on,
// and that it falls back to the plain Place row when it is off. The mocks are the
// ones DayPlanSidebar.test.tsx renders the sidebar with.
import { http, HttpResponse } from 'msw';
import { buildAssignment, buildDay, buildPlace, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
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
  // One leg per waypoint gap; the connector between two stops reads distanceText.
  calculateRouteWithLegs: vi.fn().mockImplementation((waypoints) =>
    Promise.resolve({
      distanceText: '2 km',
      durationText: '10 min',
      legs: Array.from({ length: Math.max(0, (waypoints?.length ?? 0) - 1) }, () => ({
        distanceText: '2 km',
        durationText: '10 min',
        drivingText: '10 min',
        walkingText: '25 min',
      })),
    })
  ),
}));

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
    const times = { walkingMinutes: 60, breakMinutes: 35, plannedTotalMinutes: 95, manuallyOverridden: false };
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
    expect(screen.queryByTestId('trip-plan-tour-time')).not.toBeInTheDocument();
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
