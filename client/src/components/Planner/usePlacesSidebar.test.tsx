// FE-PLANNER-PSHOOK-001 to FE-PLANNER-PSHOOK-060
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, act, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildPlace, buildDay, buildAssignment } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useAddonStore } from '../../store/addonStore';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import { ContextMenu } from '../shared/ContextMenu';
import type { Place } from '../../types';
import { usePlacesSidebar, type PlacesSidebarProps, type SidebarState } from './usePlacesSidebar';

let S: SidebarState;

// The hook owns state that only makes sense against real DOM nodes (the scroll
// container, the per-row refs, the drag counter), so it is driven through a
// stripped-down host instead of renderHook.
function Host(props: PlacesSidebarProps) {
  const state = usePlacesSidebar(props);
  S = state;
  return (
    <div
      data-testid="sidebar"
      ref={state.scrollContainerRef}
      onDragEnter={state.handleSidebarDragEnter}
      onDragOver={state.handleSidebarDragOver}
      onDragLeave={state.handleSidebarDragLeave}
      onDrop={state.handleSidebarDrop}
    >
      {state.sidebarDragOver && <span>drop-active</span>}
      {state.filtered.map((p) => (
        <div
          key={p.id}
          data-testid={`row-${p.id}`}
          ref={(el) => { state.registerPlaceRow(p.id, el); }}
          onContextMenu={(e) => state.openContextMenu(e, p)}
        >
          {p.name}
        </div>
      ))}
      <ContextMenu menu={state.ctxMenu.menu} onClose={state.ctxMenu.close} />
    </div>
  );
}

function makeProps(overrides: Partial<PlacesSidebarProps> = {}): PlacesSidebarProps {
  return {
    tripId: 1,
    places: [],
    categories: [],
    assignments: {},
    selectedDayId: null,
    selectedPlaceId: null,
    onPlaceClick: vi.fn((_id: number | null) => {}),
    onAddPlace: vi.fn(() => {}),
    onAssignToDay: vi.fn((_placeId: number, _dayId: number) => {}),
    onEditPlace: vi.fn((_place: Place) => {}),
    onDeletePlace: vi.fn((_placeId: number) => {}),
    days: [],
    isMobile: false,
    ...overrides,
  };
}

function names(): string[] {
  return S.filtered.map((p) => p.name);
}

function enableCollections() {
  seedStore(useAddonStore, {
    addons: [{ id: 'collections', name: 'Collections', type: 'global', icon: '', enabled: true }],
    loaded: true,
  });
}

const addToast = vi.fn((_message: string, _type?: string, _duration?: number) => 0);

beforeEach(() => {
  resetAllStores();
  useSaveToCollectionStore.setState({ target: null });
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  addToast.mockClear();
  window.__addToast = addToast;
});

afterEach(() => {
  delete window.__addToast;
  vi.unstubAllGlobals();
});

// ── Filtering, search and sorting ─────────────────────────────────────────────

describe('usePlacesSidebar filtering', () => {
  it('FE-PLANNER-PSHOOK-001: passes every place through when nothing is filtered', () => {
    const places = [buildPlace({ name: 'Alpha' }), buildPlace({ name: 'Beta' })];
    render(<Host {...makeProps({ places })} />);
    expect(names()).toEqual(['Alpha', 'Beta']);
    expect(S.hasTracks).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-002: search matches the name case-insensitively', () => {
    const places = [buildPlace({ name: 'Museum of Art' }), buildPlace({ name: 'Central Park' })];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setSearch('MUSEUM'); });
    expect(names()).toEqual(['Museum of Art']);
  });

  it('FE-PLANNER-PSHOOK-003: search also matches the address', () => {
    const places = [
      buildPlace({ name: 'UK Office', address: '10 Downing Street' }),
      buildPlace({ name: 'Other', address: null }),
    ];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setSearch('downing'); });
    expect(names()).toEqual(['UK Office']);
  });

  it('FE-PLANNER-PSHOOK-004: a search that matches nothing empties the list', () => {
    const places = [buildPlace({ name: 'Alpha', address: 'Rue A' })];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setSearch('zzz'); });
    expect(names()).toEqual([]);
  });

  it('FE-PLANNER-PSHOOK-005: the unplanned filter drops places assigned to a day', () => {
    const planned = buildPlace({ id: 1, name: 'Planned' });
    const loose = buildPlace({ id: 2, name: 'Loose' });
    const assignments = { '3': [buildAssignment({ place: planned, day_id: 3 })] };
    render(<Host {...makeProps({ places: [planned, loose], assignments })} />);
    act(() => { S.setFilter('unplanned'); });
    expect(names()).toEqual(['Loose']);
    expect([...S.plannedIds]).toEqual([1]);
  });

  // #2072 — a hotel is linked through its stay, never dragged onto a day, so the
  // pool called it unplanned while the day header printed its name.
  it('FE-PLANNER-PSHOOK-049: a place linked to a stay counts as planned', () => {
    const hotel = buildPlace({ id: 1, name: 'Hotel' });
    const loose = buildPlace({ id: 2, name: 'Loose' });
    const accommodations = [{ place_id: 1, start_day_id: 3, end_day_id: 5 }];
    render(<Host {...makeProps({ places: [hotel, loose], accommodations })} />);

    act(() => { S.setFilter('unplanned'); });
    expect(names()).toEqual(['Loose']);
    act(() => { S.setFilter('planned'); });
    expect(names()).toEqual(['Hotel']);
  });

  it('FE-PLANNER-PSHOOK-050: a place on a day-anchored booking counts as planned', () => {
    const venue = buildPlace({ id: 1, name: 'Venue' });
    const loose = buildPlace({ id: 2, name: 'Loose' });
    seedStore(useTripStore, { reservations: [{ id: 9, place_id: 1, day_id: 3 }] });
    render(<Host {...makeProps({ places: [venue, loose] })} />);

    act(() => { S.setFilter('unplanned'); });
    expect(names()).toEqual(['Loose']);
  });

  it('FE-PLANNER-PSHOOK-051: a booking with no day leaves its place unplanned', () => {
    const venue = buildPlace({ id: 1, name: 'Venue' });
    seedStore(useTripStore, { reservations: [{ id: 9, place_id: 1, day_id: null }] });
    render(<Host {...makeProps({ places: [venue] })} />);

    act(() => { S.setFilter('unplanned'); });
    expect(names()).toEqual(['Venue']);
  });

  it('FE-PLANNER-PSHOOK-006: the planned filter keeps only assigned places', () => {
    const planned = buildPlace({ id: 1, name: 'Planned' });
    const loose = buildPlace({ id: 2, name: 'Loose' });
    const assignments = { '3': [buildAssignment({ place: planned, day_id: 3 })] };
    render(<Host {...makeProps({ places: [planned, loose], assignments })} />);
    act(() => { S.setFilter('planned'); });
    expect(names()).toEqual(['Planned']);
  });

  it('FE-PLANNER-PSHOOK-007: the tracks filter keeps only places carrying route geometry', () => {
    const track = buildPlace({ name: 'GPX Track', route_geometry: '[[48,2],[49,3]]' });
    const spot = buildPlace({ name: 'Plain Spot' });
    render(<Host {...makeProps({ places: [track, spot] })} />);
    expect(S.hasTracks).toBe(true);
    act(() => { S.setFilter('tracks'); });
    expect(names()).toEqual(['GPX Track']);
  });

  it('Tours addon excludes Tour-backed Places from rows, counts, and localities', () => {
    const legacyTrack = buildPlace({ id: 41, name: 'Legacy track', route_geometry: '[[1,2],[3,4]]', rating_avg: 4, address: 'Vienna, Austria' });
    const ordinary = buildPlace({ id: 42, name: 'Ordinary place', address: 'Linz, Austria' });
    const tour = buildPlace({ id: 43, name: 'Tour place', tour_place_id: 43, route_geometry: '[[5,6],[7,8]]', address: 'Denver, United States' });
    render(<Host {...makeProps({
      places: [legacyTrack, ordinary, tour],
      toursEnabled: true,
      excludePlaceIds: new Set([tour.id]),
    })} />);

    expect(S.hasTracks).toBe(false);
    expect(names()).toEqual(expect.arrayContaining(['Legacy track', 'Ordinary place']));
    expect(names()).not.toContain('Tour place');
    expect(S.filterCounts).toEqual({ all: 2, unplanned: 2, planned: 0, tracks: 1 });
    expect(S.localities).toEqual([{ country: 'Austria', count: 2, regions: [] }]);

    act(() => { S.setRatingFilter(4); });
    expect(names()).toEqual(['Legacy track']);
    expect(S.filterCounts.all).toBe(2);
  });

  it('Tours addon OFF preserves legacy track Places and ignores the exclusion set', () => {
    const legacyTrack = buildPlace({ id: 51, name: 'Legacy track', route_geometry: '[[1,2],[3,4]]' });
    const dormantTour = buildPlace({ id: 52, name: 'Dormant Tour', tour_place_id: 52, route_geometry: '[[5,6],[7,8]]' });
    render(<Host {...makeProps({
      places: [legacyTrack, dormantTour],
      toursEnabled: false,
      excludePlaceIds: new Set([dormantTour.id]),
    })} />);

    expect(S.hasTracks).toBe(true);
    expect(S.filterCounts).toEqual({ all: 2, unplanned: 2, planned: 0, tracks: 2 });
    act(() => { S.setFilter('tracks'); });
    expect(names()).toEqual(expect.arrayContaining(['Legacy track', 'Dormant Tour']));
  });

  // FE-PLANNER-PSHOOK-008 (a tracks filter without any track falls back to "all")
  // moved to useTripPlanner (FE-TP-HOOK-177): the fallback now lives there, so it
  // also holds while no places list is mounted.

  it('FE-PLANNER-PSHOOK-009: a category filter keeps only that category', () => {
    const tagged = buildPlace({ name: 'Tagged', category_id: 4 });
    const other = buildPlace({ name: 'Other', category_id: 5 });
    const none = buildPlace({ name: 'None', category_id: null });
    render(<Host {...makeProps({ places: [tagged, other, none] })} />);
    act(() => { S.setCategoryFilters(new Set(['4'])); });
    expect(names()).toEqual(['Tagged']);
  });

  it('FE-PLANNER-PSHOOK-010: the "uncategorized" bucket keeps only places without a category', () => {
    const tagged = buildPlace({ name: 'Tagged', category_id: 4 });
    const none = buildPlace({ name: 'None', category_id: null });
    render(<Host {...makeProps({ places: [tagged, none] })} />);
    act(() => { S.setCategoryFilters(new Set(['uncategorized'])); });
    expect(names()).toEqual(['None']);
  });

  it('FE-PLANNER-PSHOOK-011: toggleCategoryFilter adds and removes a category', () => {
    render(<Host {...makeProps()} />);
    act(() => { S.toggleCategoryFilter('7'); });
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['7']);
    act(() => { S.toggleCategoryFilter('7'); });
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual([]);
  });

  it('FE-PLANNER-PSHOOK-012: the star filter keeps everything at or above the floor', () => {
    const places = [
      buildPlace({ name: 'Unrated' }),
      buildPlace({ name: 'Good', rating_avg: 4.2 }),
      buildPlace({ name: 'Best', rating_avg: 4.9 }),
      buildPlace({ name: 'Meh', rating_avg: 2.5 }),
    ];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setRatingFilter(4); });
    // The list keeps its own order; the filter only decides who is on it.
    expect(names()).toEqual(['Good', 'Best']);
  });

  it('FE-PLANNER-PSHOOK-013: an unrated place drops out as soon as a floor is set, and comes back with "all"', () => {
    const places = [
      buildPlace({ name: 'Unrated' }),
      buildPlace({ name: 'Rated', rating_avg: 1 }),
    ];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setRatingFilter(1); });
    expect(names()).toEqual(['Rated']);
    act(() => { S.setRatingFilter('all'); });
    expect(names()).toEqual(['Unrated', 'Rated']);
  });

  it('FE-PLANNER-PSHOOK-060: the star floor lives in the trip store, so the map and the phone list follow it', () => {
    const places = [buildPlace({ name: 'Good', rating_avg: 4 }), buildPlace({ name: 'Meh', rating_avg: 2 })];
    render(<Host {...makeProps({ places })} />);
    act(() => { S.setRatingFilter(3); });
    expect(useTripStore.getState().placesRatingFilter).toBe(3);
    // And back: a floor picked elsewhere (the phone's filter sheet) narrows this list too.
    act(() => { useTripStore.getState().setPlacesRatingFilter('all'); });
    expect(S.ratingFilter).toBe('all');
    expect(names()).toEqual(['Good', 'Meh']);
  });

  it('FE-PLANNER-PSHOOK-014: search and category filter combine', () => {
    const places = [
      buildPlace({ name: 'Cafe Nord', category_id: 4 }),
      buildPlace({ name: 'Cafe Sud', category_id: 5 }),
      buildPlace({ name: 'Bar Nord', category_id: 4 }),
    ];
    render(<Host {...makeProps({ places })} />);
    act(() => {
      S.setCategoryFilters(new Set(['4']));
      S.setSearch('cafe');
    });
    expect(names()).toEqual(['Cafe Nord']);
  });
});

// ── Multi-select ──────────────────────────────────────────────────────────────

describe('usePlacesSidebar selection', () => {
  it('FE-PLANNER-PSHOOK-015: toggleSelected adds and removes an id', () => {
    render(<Host {...makeProps({ places: [buildPlace({ id: 9 })] })} />);
    act(() => { S.toggleSelected(9); });
    expect([...S.selectedIds]).toEqual([9]);
    act(() => { S.toggleSelected(9); });
    expect([...S.selectedIds]).toEqual([]);
  });

  it('FE-PLANNER-PSHOOK-016: exitSelectMode clears the mode and the selection', () => {
    render(<Host {...makeProps({ places: [buildPlace({ id: 9 })] })} />);
    act(() => { S.setSelectMode(true); S.toggleSelected(9); });
    expect(S.selectMode).toBe(true);
    act(() => { S.exitSelectMode(); });
    expect(S.selectMode).toBe(false);
    expect(S.selectedIds.size).toBe(0);
  });

  it('FE-PLANNER-PSHOOK-017: select mode ends by itself once every selected place is gone', () => {
    const a = buildPlace({ id: 1, name: 'A' });
    const b = buildPlace({ id: 2, name: 'B' });
    const { rerender } = render(<Host {...makeProps({ places: [a, b] })} />);
    act(() => { S.setSelectMode(true); S.toggleSelected(1); });

    rerender(<Host {...makeProps({ places: [b] })} />);

    expect(S.selectMode).toBe(false);
    expect(S.selectedIds.size).toBe(0);
  });

  it('FE-PLANNER-PSHOOK-018: select mode survives while one selected place is still there', () => {
    const a = buildPlace({ id: 1, name: 'A' });
    const b = buildPlace({ id: 2, name: 'B' });
    const { rerender } = render(<Host {...makeProps({ places: [a, b] })} />);
    act(() => { S.setSelectMode(true); S.toggleSelected(1); S.toggleSelected(2); });

    rerender(<Host {...makeProps({ places: [a] })} />);

    expect(S.selectMode).toBe(true);
    expect([...S.selectedIds].sort()).toEqual([1, 2]);
  });
});

// ── Day assignment helpers ────────────────────────────────────────────────────

describe('usePlacesSidebar day helpers', () => {
  it('FE-PLANNER-PSHOOK-019: isAssignedToSelectedDay and inDaySet reflect the selected day', () => {
    const place = buildPlace({ id: 5, name: 'Assigned' });
    const assignments = { '3': [buildAssignment({ place, day_id: 3 })] };
    render(<Host {...makeProps({ places: [place], assignments, selectedDayId: 3 })} />);

    expect(S.isAssignedToSelectedDay(5)).toBe(true);
    expect(S.isAssignedToSelectedDay(99)).toBe(false);
    expect([...S.inDaySet]).toEqual([5]);
  });

  it('FE-PLANNER-PSHOOK-020: without a selected day nothing counts as assigned', () => {
    const place = buildPlace({ id: 5 });
    const assignments = { '3': [buildAssignment({ place, day_id: 3 })] };
    render(<Host {...makeProps({ places: [place], assignments, selectedDayId: null })} />);

    expect(S.isAssignedToSelectedDay(5)).toBeFalsy();
    expect(S.inDaySet.size).toBe(0);
  });

  it('FE-PLANNER-PSHOOK-021: a day without assignments yields an empty set', () => {
    const place = buildPlace({ id: 5 });
    render(<Host {...makeProps({ places: [place], assignments: {}, selectedDayId: 8 })} />);
    expect(S.inDaySet.size).toBe(0);
    expect(S.isAssignedToSelectedDay(5)).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-052: the stop a booking wrote counts as in the day when the list hides it', () => {
    // The day view hands the pool the day without the stop a booking wrote, while
    // the store still holds it. Judged on the list alone the hotel offered "add to
    // day" on its own check-in day, and that put a second row beside the night.
    const hotel = buildPlace({ id: 5, name: 'Hotel' });
    const loose = buildPlace({ id: 6, name: 'Loose' });
    const booked = buildAssignment({ place: hotel, day_id: 3, accommodation_id: 4 });
    seedStore(useTripStore, { assignments: { '3': [booked] } });
    render(<Host {...makeProps({ places: [hotel, loose], assignments: { '3': [] }, selectedDayId: 3 })} />);

    expect([...S.inDaySet]).toEqual([5]);
    expect(S.isAssignedToSelectedDay(5)).toBe(true);
    expect(S.isAssignedToSelectedDay(6)).toBe(false);
  });
});

// ── Scroll restoration and row refs ───────────────────────────────────────────

describe('usePlacesSidebar scrolling', () => {
  it('FE-PLANNER-PSHOOK-022: restores the previous scroll offset on mount', () => {
    render(<Host {...makeProps({ places: [buildPlace()], initialScrollTop: 240 })} />);
    expect(screen.getByTestId('sidebar').scrollTop).toBe(240);
  });

  it('FE-PLANNER-PSHOOK-023: a zero offset leaves the container untouched', () => {
    render(<Host {...makeProps({ places: [buildPlace()], initialScrollTop: 0 })} />);
    expect(screen.getByTestId('sidebar').scrollTop).toBe(0);
  });

  it('FE-PLANNER-PSHOOK-024: the selected row is scrolled into view exactly once', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    scrollIntoView.mockClear();
    const places = [buildPlace({ id: 1, name: 'A' }), buildPlace({ id: 2, name: 'B' })];
    const { rerender } = render(<Host {...makeProps({ places, selectedPlaceId: 2 })} />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' }));
    scrollIntoView.mockClear();

    // Re-rendering with the same selection must not scroll again.
    rerender(<Host {...makeProps({ places, selectedPlaceId: 2 })} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PSHOOK-025: clearing the selection resets the auto-scroll guard', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    const places = [buildPlace({ id: 1, name: 'A' }), buildPlace({ id: 2, name: 'B' })];
    const { rerender } = render(<Host {...makeProps({ places, selectedPlaceId: 2 })} />);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());

    rerender(<Host {...makeProps({ places, selectedPlaceId: null })} />);
    scrollIntoView.mockClear();
    rerender(<Host {...makeProps({ places, selectedPlaceId: 2 })} />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
  });

  it('FE-PLANNER-PSHOOK-026: a selected place filtered out of the list is not scrolled to', () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    const places = [buildPlace({ id: 1, name: 'Visible' }), buildPlace({ id: 2, name: 'Hidden' })];
    const { rerender } = render(<Host {...makeProps({ places, selectedPlaceId: null })} />);
    act(() => { S.setSearch('Visible'); });
    scrollIntoView.mockClear();

    // The row is unmounted by the search, so registerPlaceRow has dropped its ref.
    rerender(<Host {...makeProps({ places, selectedPlaceId: 2 })} />);

    expect(names()).toEqual(['Visible']);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

// ── Drag & drop import ────────────────────────────────────────────────────────

describe('usePlacesSidebar drag and drop', () => {
  it('FE-PLANNER-PSHOOK-027: dragging over the sidebar raises the drop hint', () => {
    render(<Host {...makeProps()} />);
    fireEvent.dragEnter(screen.getByTestId('sidebar'));
    expect(screen.getByText('drop-active')).toBeInTheDocument();
    fireEvent.dragOver(screen.getByTestId('sidebar'));
    expect(screen.getByText('drop-active')).toBeInTheDocument();
  });

  it('FE-PLANNER-PSHOOK-028: leaving the last nested target lowers the hint again', () => {
    render(<Host {...makeProps()} />);
    const sidebar = screen.getByTestId('sidebar');
    fireEvent.dragEnter(sidebar);
    fireEvent.dragEnter(sidebar);
    fireEvent.dragLeave(sidebar);
    expect(screen.getByText('drop-active')).toBeInTheDocument();
    fireEvent.dragLeave(sidebar);
    expect(screen.queryByText('drop-active')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-PSHOOK-029: read-only members get no drop hint', () => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } });
    render(<Host {...makeProps()} />);
    fireEvent.dragEnter(screen.getByTestId('sidebar'));
    fireEvent.dragOver(screen.getByTestId('sidebar'));
    expect(screen.queryByText('drop-active')).not.toBeInTheDocument();
    expect(S.canEditPlaces).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-030: dropping a file arms the file-import modal', () => {
    render(<Host {...makeProps()} />);
    const file = new File(['<gpx/>'], 'route.gpx', { type: 'application/gpx+xml' });
    fireEvent.drop(screen.getByTestId('sidebar'), { dataTransfer: { files: [file] } });

    expect(S.fileImportOpen).toBe(true);
    expect(S.sidebarDropFile?.name).toBe('route.gpx');
    expect(screen.queryByText('drop-active')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-PSHOOK-031: dropping nothing leaves the modal closed', () => {
    render(<Host {...makeProps()} />);
    fireEvent.drop(screen.getByTestId('sidebar'), { dataTransfer: { files: [] } });
    expect(S.fileImportOpen).toBe(false);
    expect(S.sidebarDropFile).toBeNull();
  });

  it('FE-PLANNER-PSHOOK-032: a read-only member cannot drop a file either', () => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } });
    render(<Host {...makeProps()} />);
    const file = new File(['<gpx/>'], 'route.gpx', { type: 'application/gpx+xml' });
    fireEvent.drop(screen.getByTestId('sidebar'), { dataTransfer: { files: [file] } });
    expect(S.fileImportOpen).toBe(false);
  });
});

// ── List import ───────────────────────────────────────────────────────────────

describe('usePlacesSidebar list import', () => {
  it('FE-PLANNER-PSHOOK-033: both providers are offered', () => {
    render(<Host {...makeProps()} />);
    expect(S.availableListImportProviders).toEqual(['google', 'naver']);
    expect(S.hasMultipleListImportProviders).toBe(true);
    expect(S.listImportProvider).toBe('google');
  });

  it('FE-PLANNER-PSHOOK-034: an empty URL does not start an import', async () => {
    let calls = 0;
    server.use(http.post('/api/trips/1/places/import/google-list', () => {
      calls++;
      return HttpResponse.json({ count: 0, skipped: 0, places: [] });
    }));
    render(<Host {...makeProps()} />);
    act(() => { S.setListImportUrl('   '); });
    await act(async () => { await S.handleListImport(); });

    expect(calls).toBe(0);
    expect(S.listImportLoading).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-035: a successful Google import reloads the trip, toasts and closes', async () => {
    const loadTrip = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadTrip });
    let sentUrl: string | undefined;
    let sentEnrich: boolean | undefined;
    server.use(http.post('/api/trips/1/places/import/google-list', async ({ request }) => {
      const body = await request.json() as { url: string; enrich?: boolean };
      sentUrl = body.url;
      sentEnrich = body.enrich;
      return HttpResponse.json({ count: 2, skipped: 0, listName: 'Tokyo', places: [{ id: 20 }, { id: 21 }] });
    }));

    const pushUndo = vi.fn((_label: string, _fn: () => Promise<void> | void) => {});
    render(<Host {...makeProps({ pushUndo })} />);
    act(() => { S.setListImportOpen(true); S.setListImportUrl(' https://maps.app.goo.gl/abc '); });
    await act(async () => { await S.handleListImport(); });

    expect(sentUrl).toBe('https://maps.app.goo.gl/abc');
    expect(sentEnrich).toBe(false);
    expect(loadTrip).toHaveBeenCalledWith(1);
    expect(addToast).toHaveBeenCalledWith('2 places imported from "Tokyo"', 'success', undefined);
    expect(S.listImportOpen).toBe(false);
    expect(S.listImportUrl).toBe('');
    expect(pushUndo).toHaveBeenCalledWith('Google Maps import', expect.any(Function));
  });

  it('FE-PLANNER-PSHOOK-036: the undo entry bulk-deletes the imported places', async () => {
    const loadTrip = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadTrip });
    server.use(http.post('/api/trips/1/places/import/google-list', () =>
      HttpResponse.json({ count: 2, skipped: 0, listName: 'Tokyo', places: [{ id: 20 }, { id: 21 }] })));
    let deletedIds: number[] = [];
    server.use(http.post('/api/trips/1/places/bulk-delete', async ({ request }) => {
      deletedIds = ((await request.json()) as { ids: number[] }).ids;
      return HttpResponse.json({ deleted: deletedIds.length });
    }));

    let undoFn: (() => Promise<void> | void) | undefined;
    const pushUndo = vi.fn((_label: string, fn: () => Promise<void> | void) => { undoFn = fn; });
    render(<Host {...makeProps({ pushUndo })} />);
    act(() => { S.setListImportUrl('https://maps.app.goo.gl/abc'); });
    await act(async () => { await S.handleListImport(); });

    await act(async () => { await undoFn?.(); });

    expect(deletedIds).toEqual([20, 21]);
    expect(loadTrip).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-PSHOOK-037: an import that skips everything warns instead of celebrating', async () => {
    seedStore(useTripStore, { loadTrip: vi.fn().mockResolvedValue(undefined) });
    server.use(http.post('/api/trips/1/places/import/google-list', () =>
      HttpResponse.json({ count: 0, skipped: 4, listName: 'Tokyo', places: [] })));

    render(<Host {...makeProps()} />);
    act(() => { S.setListImportUrl('https://maps.app.goo.gl/abc'); });
    await act(async () => { await S.handleListImport(); });

    expect(addToast).toHaveBeenCalledWith('All places were already in the trip.', 'warning', undefined);
  });

  it('FE-PLANNER-PSHOOK-038: the Naver provider hits the Naver endpoint and enriches when a maps key exists', async () => {
    seedStore(useAuthStore, { hasMapsKey: true });
    seedStore(useTripStore, { loadTrip: vi.fn().mockResolvedValue(undefined) });
    let sentEnrich: boolean | undefined;
    server.use(http.post('/api/trips/1/places/import/naver-list', async ({ request }) => {
      sentEnrich = ((await request.json()) as { enrich?: boolean }).enrich;
      return HttpResponse.json({ count: 1, skipped: 0, listName: 'Seoul', places: [{ id: 30 }] });
    }));

    const pushUndo = vi.fn((_label: string, _fn: () => Promise<void> | void) => {});
    render(<Host {...makeProps({ pushUndo })} />);
    expect(S.canEnrichImport).toBe(true);
    act(() => {
      S.setListImportProvider('naver');
      S.setListImportEnrich(true);
      S.setListImportUrl('https://naver.me/xyz');
    });
    await act(async () => { await S.handleListImport(); });

    expect(sentEnrich).toBe(true);
    expect(addToast).toHaveBeenCalledWith('1 place imported from "Seoul"', 'success', undefined);
    expect(pushUndo).toHaveBeenCalledWith('Naver Maps import', expect.any(Function));
  });

  it('FE-PLANNER-PSHOOK-039: enrichment stays off while the instance has no maps key', async () => {
    seedStore(useTripStore, { loadTrip: vi.fn().mockResolvedValue(undefined) });
    let sentEnrich: boolean | undefined;
    server.use(http.post('/api/trips/1/places/import/google-list', async ({ request }) => {
      sentEnrich = ((await request.json()) as { enrich?: boolean }).enrich;
      return HttpResponse.json({ count: 1, skipped: 0, listName: 'Tokyo', places: [] });
    }));

    render(<Host {...makeProps()} />);
    expect(S.canEnrichImport).toBe(false);
    act(() => { S.setListImportEnrich(true); S.setListImportUrl('https://maps.app.goo.gl/abc'); });
    await act(async () => { await S.handleListImport(); });

    expect(sentEnrich).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-040: a failing import surfaces the server message', async () => {
    server.use(http.post('/api/trips/1/places/import/google-list', () =>
      HttpResponse.json({ error: 'List is private' }, { status: 400 })));

    render(<Host {...makeProps()} />);
    act(() => { S.setListImportOpen(true); S.setListImportUrl('https://maps.app.goo.gl/abc'); });
    await act(async () => { await S.handleListImport(); });

    expect(addToast).toHaveBeenCalledWith('List is private', 'error', undefined);
    // The dialog stays open so the URL can be corrected.
    expect(S.listImportOpen).toBe(true);
    expect(S.listImportLoading).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-041: a failure without a server message falls back to the translated one', async () => {
    server.use(http.post('/api/trips/1/places/import/naver-list', () => new HttpResponse(null, { status: 500 })));

    render(<Host {...makeProps()} />);
    act(() => { S.setListImportProvider('naver'); S.setListImportUrl('https://naver.me/xyz'); });
    await act(async () => { await S.handleListImport(); });

    expect(addToast).toHaveBeenCalledWith('Failed to import Naver Maps list', 'error', undefined);
  });
});

// ── Row context menu ──────────────────────────────────────────────────────────

describe('usePlacesSidebar context menu', () => {
  it('FE-PLANNER-PSHOOK-042: a full-permission row offers edit, day, website, maps, collection and delete', () => {
    enableCollections();
    const place = buildPlace({ id: 3, name: 'Cafe', website: 'https://cafe.example', google_place_id: 'ChIJ1' });
    render(<Host {...makeProps({ places: [place], selectedDayId: 6 })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Website' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google Maps' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save to Collection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('FE-PLANNER-PSHOOK-043: a read-only row without extras only offers the maps link', () => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } });
    const place = buildPlace({ id: 3, name: 'Cafe', website: null });
    render(<Host {...makeProps({ places: [place], selectedDayId: null })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Day' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Website' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save to Collection' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google Maps' })).toBeInTheDocument();
  });

  it('FE-PLANNER-PSHOOK-044: Edit hands the place back to the planner', async () => {
    const user = userEvent.setup();
    const onEditPlace = vi.fn((_place: Place) => {});
    const place = buildPlace({ id: 3, name: 'Cafe' });
    render(<Host {...makeProps({ places: [place], onEditPlace })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEditPlace).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
  });

  it('FE-PLANNER-PSHOOK-045: "+ Day" uses the day that was selected when the menu opened', async () => {
    const user = userEvent.setup();
    const onAssignToDay = vi.fn((_placeId: number, _dayId: number) => {});
    const place = buildPlace({ id: 3, name: 'Cafe' });
    const days = [buildDay({ id: 6 })];
    render(<Host {...makeProps({ places: [place], days, selectedDayId: 6, onAssignToDay })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: '+ Day' }));

    expect(onAssignToDay).toHaveBeenCalledWith(3, 6);
  });

  it('FE-PLANNER-PSHOOK-046: Delete hands the id back to the planner', async () => {
    const user = userEvent.setup();
    const onDeletePlace = vi.fn((_placeId: number) => {});
    const place = buildPlace({ id: 3, name: 'Cafe' });
    render(<Host {...makeProps({ places: [place], onDeletePlace })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDeletePlace).toHaveBeenCalledWith(3);
  });

  it('FE-PLANNER-PSHOOK-047: Website and Google Maps open a new tab', async () => {
    const user = userEvent.setup();
    const open = vi.fn(() => null);
    vi.stubGlobal('open', open);
    const place = buildPlace({ id: 3, name: 'Cafe', website: 'https://cafe.example', lat: 48.8584, lng: 2.2945, google_place_id: null });
    render(<Host {...makeProps({ places: [place] })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: 'Open Website' }));
    expect(open).toHaveBeenCalledWith('https://cafe.example', '_blank', 'noopener,noreferrer');

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: 'Google Maps' }));
    expect(open).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=48.8584,2.2945', '_blank');
  });

  it('FE-PLANNER-PSHOOK-048: "Save to Collection" arms the picker with the place', async () => {
    const user = userEvent.setup();
    enableCollections();
    const place = buildPlace({ id: 3, name: 'Cafe', address: 'Rue A' });
    render(<Host {...makeProps({ places: [place] })} />);

    fireEvent.contextMenu(screen.getByTestId('row-3'));
    await user.click(screen.getByRole('button', { name: 'Save to Collection' }));

    expect(useSaveToCollectionStore.getState().target).toMatchObject({
      name: 'Cafe',
      address: 'Rue A',
      source_place_id: 3,
    });
  });
});

// ── The filter panel's figures and the row's "…" ──────────────────────────────

describe('usePlacesSidebar filter panel', () => {
  it('FE-PLANNER-PSHOOK-053: filterCounts counts each choice under search and categories, not the rating floor', () => {
    const planned = buildPlace({ id: 1, name: 'Alpha Planned', category_id: 4, rating_avg: 1 });
    const loose = buildPlace({ id: 2, name: 'Alpha Loose', category_id: 4, route_geometry: '[[1,2],[3,4]]' });
    const other = buildPlace({ id: 3, name: 'Beta', category_id: null });
    const assignments = { '9': [buildAssignment({ place: planned, day_id: 9 })] };
    render(<Host {...makeProps({ places: [planned, loose, other], assignments })} />);
    expect(S.filterCounts).toEqual({ all: 3, unplanned: 2, planned: 1, tracks: 1 });

    act(() => { S.setSearch('alpha'); });
    act(() => { S.setRatingFilter(5); });
    expect(S.filterCounts).toEqual({ all: 2, unplanned: 1, planned: 1, tracks: 1 });

    act(() => { S.setCategoryFilters(new Set(['uncategorized'])); });
    expect(S.filterCounts).toEqual({ all: 0, unplanned: 0, planned: 0, tracks: 0 });
  });

  it('FE-PLANNER-PSHOOK-054: while a day is open "planned" counts that day only', () => {
    const today = buildPlace({ id: 1, name: 'Today' });
    const later = buildPlace({ id: 2, name: 'Later' });
    const assignments = {
      '1': [buildAssignment({ place: today, day_id: 1 })],
      '2': [buildAssignment({ place: later, day_id: 2 })],
    };
    render(<Host {...makeProps({ places: [today, later], assignments, days: [buildDay({ id: 1 }), buildDay({ id: 2 })], selectedDayId: 1 })} />);
    expect(S.filterCounts.planned).toBe(1);
    expect(S.filterCounts.unplanned).toBe(0);
  });

  it('FE-PLANNER-PSHOOK-056: pickFilter changes the choice and starts a fresh selection', () => {
    render(<Host {...makeProps({ places: [buildPlace({ id: 1 }), buildPlace({ id: 2 })] })} />);
    act(() => { S.setSelectedIds(new Set([1, 2])); });
    act(() => { S.pickFilter('planned'); });
    expect(useTripStore.getState().placesFilter).toBe('planned');
    expect(S.selectedIds.size).toBe(0);
  });

});

describe('usePlacesSidebar row menu entries', () => {
  it('FE-PLANNER-PSHOOK-058: placeMenuItems lists what the right-click shows, with "+ Day" for the given day', () => {
    enableCollections();
    const onAssignToDay = vi.fn((_placeId: number, _dayId: number) => {});
    const place = buildPlace({ id: 3, name: 'Cafe', website: 'https://cafe.example', google_place_id: 'ChIJ1' });
    render(<Host {...makeProps({ places: [place], onAssignToDay })} />);

    const withDay = S.placeMenuItems(place, 4);
    expect(withDay.map(e => e.divider ? '---' : e.label)).toEqual(['Edit', '+ Day', 'Open Website', 'Google Maps', 'Save to Collection', '---', 'Delete']);
    withDay[1].onClick?.();
    expect(onAssignToDay).toHaveBeenCalledWith(3, 4);

    // No day, no "+ Day".
    expect(S.placeMenuItems(place, null).some(e => e.label === '+ Day')).toBe(false);
  });

  it('FE-PLANNER-PSHOOK-059: a read-only member gets no edit or delete entries from placeMenuItems', () => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } });
    const place = buildPlace({ id: 3, name: 'Cafe', website: null, lat: null, lng: null, google_place_id: null });
    render(<Host {...makeProps({ places: [place] })} />);
    const labels = S.placeMenuItems(place, null).filter(e => !e.divider).map(e => e.label);
    expect(labels).not.toContain('Edit');
    expect(labels).not.toContain('Delete');
  });
});
