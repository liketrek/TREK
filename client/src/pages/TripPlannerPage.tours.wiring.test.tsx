// The TOUR-PLANNER location search, wired through the planner page.
//
// The same harness as TripPlannerPage.wiring.test.tsx: the hook is replaced by
// the shared fixture (TripPlannerPage.wiring.fixture.ts) and every child the
// page mounts is a stub that records its props, so the map's focus and the
// planner callbacks can be read and driven directly.
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { buildUser } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import { act, render, screen, waitFor } from '../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../tests/helpers/store';
import { assignmentsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTripStore } from '../store/tripStore';
import TripPlannerPage from './TripPlannerPage';
import { baseState, type HookState } from './TripPlannerPage.wiring.fixture';

// ── Component stubs ───────────────────────────────────────────────────────────
// Each stub records the props it was rendered with so the page's inline
// callbacks can be invoked from the test.
type Props = Record<string, unknown>;
const captured: Record<string, Props> = {};
const plannerActions = vi.hoisted(() => ({
  viewGpxTour: vi.fn(),
  addWaypoint: vi.fn(),
  setWaypointPosition: vi.fn(() => true),
  openTour: vi.fn(),
  startNewTour: vi.fn(),
  forgetDeletedTour: vi.fn((_placeId: number) => undefined),
  saveOutcome: null as unknown,
  mapFocusKey: 0,
  newDraftGeneration: 0,
  mode: { type: 'neutral' } as unknown,
  isSaving: false,
  waypoints: [] as unknown,
  routeProfileFocus: null as unknown,
  readOnlyGpxTour: null as unknown,
  readOnlyGpxAnalysis: null as unknown,
}));

function stub(name: string, testId?: string) {
  return (props: Props) => {
    captured[name] = props;
    return testId ? React.createElement('div', { 'data-testid': testId }) : null;
  };
}

type AnyProp = ((...args: unknown[]) => unknown) & Record<string, unknown>;

/** The last-rendered props of a stub, typed loosely so callbacks can be invoked. */
function props(name: string): Record<string, AnyProp> {
  return (captured[name] ?? {}) as Record<string, AnyProp>;
}

vi.mock('../components/Map/MapViewAuto', () => ({ MapViewAuto: stub('map', 'map-view') }));
vi.mock('../components/Map/MapCompassPill', () => ({ MapCompassPill: stub('compass', 'compass-pill') }));
const poiCategories = vi.hoisted(() => ({ core: [], plugin: [] }));
vi.mock('../components/Map/PoiCategoryPill', () => ({ default: stub('poiPill', 'poi-pill') }));
vi.mock('../components/Map/usePoiExplore', () => ({
  usePoiExplore: () => ({
    categories: poiCategories,
    active: [],
    pois: [],
    loadingKeys: [],
    errorKeys: [],
    moved: false,
    toggle: vi.fn(),
    searchArea: vi.fn(),
    onViewportChange: vi.fn(),
  }),
}));

vi.mock('../components/Layout/Navbar', () => ({ default: stub('navbar', 'navbar') }));
vi.mock('../components/shared/SlidingTabs', () => ({ default: stub('tabs', 'sliding-tabs'), TabLabel: () => null }));
vi.mock('../components/shared/TripLoadingSplash', () => ({
  default: ({ title }: { title?: string }) =>
    React.createElement('div', { 'data-testid': 'splash', role: 'status' }, title ?? 'TREK'),
}));
vi.mock('../components/shared/ConfirmDialog', () => ({ default: () => null }));

vi.mock('../components/Planner/DayPlanSidebar', () => ({ default: stub('dayPlan', 'day-plan-sidebar') }));
vi.mock('../components/Planner/PlacesSidebar', () => ({ default: stub('places', 'places-sidebar') }));
vi.mock('../components/Planner/PlaceInspector', () => ({ default: stub('inspector', 'place-inspector') }));
vi.mock('../components/Planner/DayDetailPanel', () => ({ default: stub('dayDetail', 'day-detail-panel') }));
vi.mock('../components/Planner/PlaceFormModal', () => ({ default: stub('placeForm') }));
vi.mock('../components/Planner/ReservationModal', () => ({ ReservationModal: stub('reservationModal') }));
vi.mock('../components/Planner/TransportModal', () => ({ TransportModal: stub('transportModal', 'transport-modal') }));
vi.mock('../components/Planner/TransitJourneyModal', () => ({ default: stub('transitModal', 'transit-modal') }));
vi.mock('../components/Planner/bookings/BookingDetailHost', () => ({
  BookingDetailPopup: stub('bookingDetail', 'booking-detail'),
}));
vi.mock('../components/Planner/BookingImportModal', () => ({ default: stub('bookingImport') }));
vi.mock('../components/Planner/AirTrailImportModal', () => ({ default: stub('airtrailImport') }));
vi.mock('../components/Planner/ReservationsPanel', () => ({
  default: stub('reservationsPanel', 'reservations-panel'),
}));
vi.mock('../components/Planner/TripWarningsBanner', () => ({ default: stub('warnings', 'trip-warnings') }));
vi.mock('../components/Tours/TourDetailDialog', () => ({ default: stub('tourDetail', 'tour-detail-dialog') }));
vi.mock('../components/Tours/planner/useTourPlanner', async () => {
  const { hikePlannerDefaults } = await import('../../tests/helpers/tourPlannerStub');
  const defaults = hikePlannerDefaults();
  return {
    useTourPlanner: () => ({
      ...defaults,
      route: null,
      waypoints: plannerActions.waypoints,
      routeProfileFocus: plannerActions.routeProfileFocus,
      name: '',
      startNewTour: plannerActions.startNewTour,
      newTourConfirmationOpen: false,
      cancelNewTour: vi.fn(),
      elevationProfileExpanded: true,
      toggleElevationProfile: vi.fn(),
      newDraftGeneration: plannerActions.newDraftGeneration,
      mapFocusKey: plannerActions.mapFocusKey,
      mode: plannerActions.mode,
      isSaving: plannerActions.isSaving,
      selectedWaypointId: null,
      editingPlaceId: null,
      saveOutcome: plannerActions.saveOutcome,
      hasUnsavedChanges: false,
      setSelectedWaypointId: vi.fn(),
      mapBaseLayer: 'map',
      setMapBaseLayer: vi.fn(),
      openTour: plannerActions.openTour,
      viewGpxTour: plannerActions.viewGpxTour,
      addWaypoint: plannerActions.addWaypoint,
      setWaypointPosition: plannerActions.setWaypointPosition,
      closeGpxTour: vi.fn(),
      readOnlyGpxTour: plannerActions.readOnlyGpxTour,
      readOnlyGpxAnalysis: plannerActions.readOnlyGpxAnalysis,
      discard: vi.fn(),
      forgetDeletedTour: plannerActions.forgetDeletedTour,
    }),
  };
});

vi.mock('../components/Trips/TripFormModal', () => ({ default: stub('tripForm') }));
vi.mock('../components/Trips/TripMembersModal', () => ({ default: stub('membersModal') }));
vi.mock('../components/Packing/PackingListPanel', () => ({ default: stub('packingPanel', 'packing-list-panel') }));
vi.mock('../components/Packing/ApplyTemplateButton', () => ({ default: stub('applyTemplate', 'apply-template') }));
vi.mock('../components/Packing/PackingExportMenu', () => ({ default: stub('exportMenu', 'export-menu') }));
vi.mock('../components/Todo/TodoListPanel', () => ({ default: stub('todoPanel', 'todo-list-panel') }));
vi.mock('../components/Files/FileManager', () => ({ default: stub('fileManager', 'file-manager') }));
vi.mock('../components/Budget/CostsPanel', () => ({
  default: stub('costsPanel', 'costs-panel'),
  ExpenseModal: stub('expenseModal', 'expense-modal'),
}));
vi.mock('../components/Collab/CollabPanel', () => ({ default: stub('collabPanel', 'collab-panel') }));
vi.mock('../components/Plugins/PluginFrame', () => ({ default: stub('pluginFrame', 'plugin-frame') }));

// ── useTripPlanner fixture ────────────────────────────────────────────────────

let hookState: HookState;

vi.mock('./tripPlanner/useTripPlanner', () => ({
  useTripPlanner: () => hookState,
}));

function renderPage(overrides: HookState = {}) {
  hookState = { ...hookState, ...overrides };
  return render(<TripPlannerPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  resetAllStores();
  for (const key of Object.keys(captured)) delete captured[key];
  plannerActions.viewGpxTour.mockReset();
  plannerActions.addWaypoint.mockReset();
  plannerActions.setWaypointPosition.mockReset().mockReturnValue(true);
  plannerActions.openTour.mockReset();
  plannerActions.startNewTour.mockReset();
  plannerActions.forgetDeletedTour.mockReset();
  plannerActions.saveOutcome = null;
  plannerActions.mapFocusKey = 0;
  plannerActions.newDraftGeneration = 0;
  plannerActions.mode = { type: 'neutral' };
  plannerActions.isSaving = false;
  plannerActions.waypoints = [];
  plannerActions.routeProfileFocus = null;
  plannerActions.readOnlyGpxTour = null;
  plannerActions.readOnlyGpxAnalysis = null;
  hookState = baseState();
  seedStore(useAuthStore, { isAuthenticated: true, user: buildUser({ id: 5 }) });
  useTripStore.setState({ loadBudgetItems: vi.fn(async () => undefined) } as never);
});

describe('TripPlannerPage — shell', () => {
  it('shows location search only in TOUR-PLANNER and focuses a result without writing planner data', async () => {
    const user = userEvent.setup();
    const createAssignment = vi.spyOn(assignmentsApi, 'create');
    server.use(
      http.post('/api/maps/search', async ({ request }) => {
        const { query } = (await request.json()) as { query: string };
        expect(query).toBe('Kyoto');
        return HttpResponse.json({
          places: [{ name: 'Kyoto', address: 'Japan', lat: 35.0116, lng: 135.7681, osm_id: 'kyoto' }],
        });
      })
    );

    const view = renderPage({
      activeTab: 'tour-planner',
      enabledAddons: { packing: true, budget: true, documents: true, collab: true, tours: true },
      toursEnabled: true,
      places: [],
    });
    const input = screen.getByRole('combobox', { name: 'tours.planner.mapSearch' });
    const mapElement = screen.getByTestId('map-view');

    await user.type(input, 'Kyoto');
    await screen.findByRole('option', { name: /Kyoto/ });
    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => expect(props('map').focusPoints).toEqual([[35.0116, 135.7681]]));
    expect(props('map').focusKey).toBe('tour:0:search:1');
    expect(props('map').places).toEqual([]);
    expect(props('map').plannerWaypoints).toEqual([]);
    expect(props('map').onPlannerWaypointMove).toBeUndefined();
    expect(screen.getByTestId('map-view')).toBe(mapElement);
    expect(plannerActions.addWaypoint).not.toHaveBeenCalled();
    expect(plannerActions.openTour).not.toHaveBeenCalled();
    expect(plannerActions.startNewTour).not.toHaveBeenCalled();

    plannerActions.mode = { type: 'new-draft' };
    plannerActions.mapFocusKey = 1;
    view.rerender(<TripPlannerPage />);
    expect(props('map').focusPoints).toEqual([]);
    expect(props('map').focusKey).toBe('tour:1');
    expect(props('map').onPlannerWaypointMove).toBe(plannerActions.setWaypointPosition);
    expect(screen.getByTestId('map-view')).toBe(mapElement);
    expect(plannerActions.addWaypoint).not.toHaveBeenCalled();

    act(() => {
      props('map').onMapClick({ latlng: { lat: 35.02, lng: 135.77 } });
    });
    expect(plannerActions.addWaypoint).toHaveBeenCalledOnce();
    expect(plannerActions.addWaypoint).toHaveBeenCalledWith(35.02, 135.77);
    act(() => {
      props('map').onPlannerWaypointMove('via-1', 35.03, 135.78);
    });
    expect(plannerActions.setWaypointPosition).toHaveBeenCalledOnce();
    expect(plannerActions.setWaypointPosition).toHaveBeenCalledWith('via-1', 35.03, 135.78);
    expect(createAssignment).not.toHaveBeenCalled();
    expect(plannerActions.openTour).not.toHaveBeenCalled();
    createAssignment.mockRestore();

    view.unmount();
    renderPage({ activeTab: 'plan', showPlaceForm: true });
    expect(screen.queryByRole('combobox', { name: 'tours.planner.mapSearch' })).not.toBeInTheDocument();
  });
});
