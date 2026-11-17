import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MKeyboardHost from '../../../../src/mobile/keyboard/MKeyboardHost';
import { useShortcutRegistry } from '../../../../src/mobile/keyboard/shortcuts';
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell';
import { useAuthStore } from '../../../../src/store/authStore';
import { useDocSyncOfferStore } from '../../../../src/store/docSyncOfferStore';
import type { Day } from '../../../../src/types';
import { buildPlanner } from '../../../helpers/mobileTrip';
import { server } from '../../../helpers/msw/server';
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render';
import { setSizeClass } from '../../../helpers/sizeClass';
import { seedStore } from '../../../helpers/store';

// FE-MOB-SHELLW-001 onwards: the trip screen on a wide window (iPad, foldable unfolded).

const mocks = vi.hoisted(() => ({ planner: {} as TripPlanner }));

// The shortcuts are the app's (MKeyboardHost): an iPad without native key commands.
vi.mock('../../../../src/native/platform', () => ({
  isNativeApp: () => true,
  isNativeIos: () => true,
  isNativeAndroid: () => false,
  nativeServerHost: () => null,
}));
vi.mock('../../../../src/pages/tripPlanner/useTripPlanner', () => ({
  useTripPlanner: () => mocks.planner,
}));
vi.mock('../../../../src/mobile/screens/trip/plan/MPlanTimeline', () => ({ default: () => null }));
vi.mock('../../../../src/mobile/screens/trip/map/MMapArea', () => ({ default: () => null }));
vi.mock('../../../../src/mobile/screens/trip/places/MPlacesBrowser', () => ({ default: () => null }));
vi.mock('../../../../src/mobile/screens/trip/tabs/MTripTabPanel', () => ({ default: () => null }));
vi.mock('../../../../src/mobile/screens/trip/sheets/MTripSheets', () => ({ default: () => null }));

import MTripShell from '../../../../src/mobile/screens/trip/MTripShell';

// Recorded through spies, not module variables a render would write to.
const seen = vi.fn<(shell: MTripShellApi) => void>();
const mapMounted = vi.fn();
const shellApi = () => seen.mock.lastCall?.[0] as MTripShellApi;

function slot(testId: string) {
  return function Slot({ shell }: { planner: TripPlanner; shell: MTripShellApi }) {
    seen(shell);
    return <div data-testid={testId} />;
  };
}
const PlanTimelineSlot = slot('plan-timeline');
const PlacesBrowserSlot = slot('places-browser');
const SheetsSlot = slot('sheets');
function MapAreaSlot({ shell }: { planner: TripPlanner; shell: MTripShellApi }) {
  seen(shell);
  useEffect(() => {
    mapMounted();
  }, []);
  return <div data-testid="map-area" />;
}
function TabSlot({ shell, tab }: { planner: TripPlanner; shell: MTripShellApi; tab: string }) {
  seen(shell);
  return <div data-testid="tab-panel">{tab}</div>;
}

const TRIP_TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'transports', label: 'Transport' },
  { id: 'buchungen', label: 'Bookings' },
  { id: 'finanzplan', label: 'Budget' },
  { id: 'listen', label: 'Lists' },
  { id: 'dateien', label: 'Files' },
  { id: 'collab', label: 'Collaboration' },
];

const DAYS = [
  { id: 11, trip_id: 1, day_number: 1, date: '2026-05-02', title: null },
  { id: 12, trip_id: 1, day_number: 2, date: '2026-05-03', title: null },
  { id: 13, trip_id: 1, day_number: 3, date: '2026-05-04', title: null },
] as unknown as Day[];

function renderShell(overrides: Partial<TripPlanner> = {}) {
  mocks.planner = buildPlanner({ days: DAYS, selectedDayId: 12, TRIP_TABS, ...overrides } as Partial<TripPlanner>);
  return render(
    <>
      <MKeyboardHost />
      <MTripShell
        PlanTimeline={PlanTimelineSlot}
        MapArea={MapAreaSlot}
        PlacesBrowser={PlacesBrowserSlot}
        TabPanel={TabSlot}
        Sheets={SheetsSlot}
      />
    </>
  );
}

const tripRail = () => screen.getByRole('navigation', { name: 'Trip sections' });
const root = (container: HTMLElement) => container.querySelector('.m-trip') as HTMLElement;

describe('MTripShell on a wide window', () => {
  beforeEach(() => {
    sessionStorage.clear();
    seen.mockClear();
    mapMounted.mockClear();
    useShortcutRegistry.setState({ lists: [] });
    useDocSyncOfferStore.setState({ bound: {}, providers: null });
    seedStore(useAuthStore, { user: null, isAuthenticated: false });
    server.use(
      http.get('/api/trips/:tripId/docsync/providers', () => HttpResponse.json([])),
      http.get('/api/trips/:tripId/docsync/links', () => HttpResponse.json([]))
    );
  });

  it('FE-MOB-SHELLW-001: the sections stand in a rail, every one of them, instead of the dock', () => {
    setSizeClass('wide');
    renderShell();
    const labels = within(tripRail())
      .getAllByRole('button')
      .map((b) => b.getAttribute('title'));
    expect(labels).toEqual(['Plan', 'Transport', 'Bookings', 'Budget', 'Lists', 'Files', 'Collaboration', 'More']);
    fireEvent.click(within(tripRail()).getByRole('button', { name: 'Files' }));
    expect(mocks.planner.handleTabChange).toHaveBeenCalledWith('dateien');
    fireEvent.click(within(tripRail()).getByRole('button', { name: 'More' }));
    expect(shellApi().sheet).toEqual({ id: 'mehr', payload: undefined });
  });

  it('FE-MOB-SHELLW-002: with room for two panes the plan sits beside the map, which follows its day', () => {
    setSizeClass('split');
    const { container } = renderShell();
    expect(screen.getByTestId('plan-timeline')).toBeInTheDocument();
    expect(shellApi().paneOpen).toBe(true);
    // The map is on screen too, so its chrome is up and "show on map" has nowhere to go.
    expect(shellApi().mapFront).toBe(true);
    expect(root(container).style.getPropertyValue('--trip-pane')).toBe('var(--trip-pane-open)');
    expect(mocks.planner.autoShowRoute).toHaveBeenCalled();
    expect(mocks.planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([12]));
  });

  it('FE-MOB-SHELLW-003: the switch hides and shows the pane like a sidebar, the map runs under the rail meanwhile', () => {
    setSizeClass('split');
    const { container } = renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.hidePane' }));
    expect(shellApi().paneOpen).toBe(false);
    expect(screen.queryByTestId('plan-timeline')).not.toBeInTheDocument();
    expect(root(container).style.getPropertyValue('--trip-map-start')).toBe('0px');
    expect(root(container).style.getPropertyValue('--trip-map-inset')).toBe('var(--m-rail-w)');

    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.showPane' }));
    expect(shellApi().paneOpen).toBe(true);
    expect(screen.getByTestId('plan-timeline')).toBeInTheDocument();
  });

  it('FE-MOB-SHELLW-007: the map frames the day beside the pane, and again once its box has changed', async () => {
    setSizeClass('split');
    renderShell();
    // On arrival, as the map toggle frames it: the day, without the list flag.
    expect(mocks.planner.handleSelectDay).toHaveBeenCalledWith(12, false);
    vi.mocked(mocks.planner.handleSelectDay).mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.hidePane' }));
    vi.mocked(mocks.planner.handleSelectDay).mockClear();
    await waitFor(() => expect(mocks.planner.handleSelectDay).toHaveBeenCalledWith(12, false), { timeout: 1500 });
  });

  it('FE-MOB-SHELLW-004: folding to compact mid-plan keeps the map and the day, and brings the dock back', () => {
    setSizeClass('split');
    renderShell();
    const mountsBefore = mapMounted.mock.calls.length;
    setSizeClass('compact');
    expect(screen.queryByRole('navigation', { name: 'Trip sections' })).not.toBeInTheDocument();
    // The dock's More, named by the planner's t like the rest of the dock.
    expect(screen.getByRole('button', { name: 'mobileTrip.more' })).toBeInTheDocument();
    expect(shellApi().paneOpen).toBe(false);
    expect(shellApi().view).toBe('plan');
    expect(screen.getByTestId('plan-timeline')).toBeInTheDocument();
    // The same map instance, not a new one: a remount reloads every tile.
    expect(mapMounted).toHaveBeenCalledTimes(mountsBefore);
  });

  it('FE-MOB-SHELLW-005: a hardware keyboard switches sections, steps through days and toggles the pane', () => {
    setSizeClass('split');
    renderShell();
    fireEvent.keyDown(document.body, { key: '3', metaKey: true });
    expect(mocks.planner.handleTabChange).toHaveBeenCalledWith('buchungen');

    fireEvent.keyDown(document.body, { key: 'ArrowRight', altKey: true });
    expect(mocks.planner.handleSelectDay).toHaveBeenCalledWith(13, true);
    fireEvent.keyDown(document.body, { key: 'ArrowLeft', altKey: true });
    expect(mocks.planner.handleSelectDay).toHaveBeenCalledWith(11, true);

    fireEvent.keyDown(document.body, { key: 's', metaKey: true, ctrlKey: true });
    expect(shellApi().paneOpen).toBe(false);

    fireEvent.keyDown(document.body, { key: '[', metaKey: true });
    expect(mocks.planner.navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('FE-MOB-SHELLW-010: ⌘N creates what the tab on show creates, and says so', () => {
    setSizeClass('split');
    renderShell({ activeTab: 'finanzplan' } as Partial<TripPlanner>);
    const trip = useShortcutRegistry.getState().lists.find((l) => l.owner === 'trip');
    expect(trip?.shortcuts.find((s) => s.id === 'create')?.title).toBe('costs.addExpense');
    fireEvent.keyDown(document.body, { key: 'n', metaKey: true });
    expect(mocks.planner.navigate).toHaveBeenCalledWith('/trips/1?create=expense');
  });

  it('FE-MOB-SHELLW-006: the phone keeps its dock and its full-screen plan', () => {
    // Pinned: in the app jsdom's 1024x768 window would read as a tablet.
    setSizeClass('compact');
    renderShell();
    expect(screen.queryByRole('navigation', { name: 'Trip sections' })).not.toBeInTheDocument();
    expect(shellApi().paneOpen).toBe(false);
    expect(shellApi().mapFront).toBe(false);
    expect(screen.getByRole('button', { name: 'mobileTrip.mapView' })).toBeInTheDocument();
  });

  it('FE-MOB-SHELLW-008: beside the plan there is no all-days switch to empty it, on the bare map and beside the places there is', () => {
    setSizeClass('split');
    renderShell();
    expect(screen.queryByRole('button', { name: 'mobileTrip.allDays' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }));
    expect(screen.getByRole('button', { name: 'mobileTrip.allDays' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.hidePane' }));
    expect(screen.getByRole('button', { name: 'mobileTrip.allDays' })).toBeInTheDocument();
  });

  it('FE-MOB-SHELLW-009: leaving the places for the plan after an all-days deselect brings a day back', () => {
    setSizeClass('split');
    renderShell({ selectedDayId: null });
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }));
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.travel' }));
    expect(mocks.planner.handleSelectDay).toHaveBeenCalledWith(expect.any(Number), true);
  });

  it('FE-MOB-SHELLW-011: a large screen keeps the tours tab and hands it to its panel', () => {
    setSizeClass('split');
    renderShell({
      activeTab: 'tour-planner',
      TRIP_TABS: [...TRIP_TABS, { id: 'tour-planner', label: 'Tours' }],
    } as Partial<TripPlanner>);
    expect(mocks.planner.handleTabChange).not.toHaveBeenCalledWith('plan');
    expect(screen.getByTestId('tab-panel')).toHaveTextContent('tour-planner');
    expect(
      within(screen.getByRole('navigation', { name: 'Trip sections' })).getByRole('button', { name: 'Tours' })
    ).toBeInTheDocument();
  });

  it('FE-MOB-SHELLW-012: folded to a phone the tours tab goes back to the plan, where the places browser keeps the tours', () => {
    setSizeClass('compact');
    renderShell({ activeTab: 'tour-planner' } as Partial<TripPlanner>);
    expect(mocks.planner.handleTabChange).toHaveBeenCalledWith('plan');
  });
});
