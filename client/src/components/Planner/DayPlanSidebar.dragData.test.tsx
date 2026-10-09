// FE-PLANNER-DAYPLAN-236: the drag data a booking drop leaves behind. The mocks
// are the ones DayPlanSidebar.test.tsx renders the sidebar with.
import { http, HttpResponse } from 'msw';
import { buildDay, buildReservation, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { Reservation } from '../../types';
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
  clearExchangeRateCache();
  server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])));
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  seedStore(useSettingsStore, { settings: { time_format: '24h', temperature_unit: 'celsius' } } as never);
});

afterEach(() => {
  window.__dragData = null;
});

describe('DayPlanSidebar drag data', () => {
  it('FE-PLANNER-DAYPLAN-236: a booking moved to another day body clears the shared drag data, as the end zone does', () => {
    const updateReservation = vi.fn(async () => ({}) as Reservation);
    useTripStore.setState({ updateReservation } as unknown as Partial<TripStoreState>);
    const days = [
      buildDay({ id: 10, date: '2025-06-01', title: 'Day 1' }),
      buildDay({ id: 11, date: '2025-06-02', title: 'Day 2' }),
    ];
    const train = buildReservation({
      id: 402,
      type: 'train',
      title: 'Night train',
      day_id: 10,
      reservation_time: '2025-06-01T22:00:00',
    });
    render(<DayPlanSidebar {...makeDefaultProps({ days, reservations: [train] })} />);
    // Left behind by an earlier drag from the place list or the map.
    window.__dragData = { placeId: '77' };
    const row = screen.getByText('Night train').closest('[draggable="true"]') as HTMLElement;
    fireEvent.dragStart(row, { dataTransfer: { setData: vi.fn(), effectAllowed: '', getData: vi.fn(() => '') } });
    fireEvent.drop(document.querySelectorAll('[data-dp="day-body"]')[1], {
      dataTransfer: { getData: vi.fn(() => '') },
    });
    expect(updateReservation).toHaveBeenCalledWith(1, 402, { day_id: 11, end_day_id: 11 });
    expect(window.__dragData).toBeNull();
  });
});
