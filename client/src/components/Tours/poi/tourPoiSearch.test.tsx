import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourPoi, TourPoiSearchResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourPoiSearchRepo } from '../../../repo/tourPoiSearchRepo';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import { normalizePlannerWaypoints, type TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { TourPlannerController } from '../planner/useTourPlanner';
import TourPoiOverlay from './TourPoiCard';
import { TourPoiSearchCard } from './TourPoiSearchCard';
import { usePoiInsertion, type PoiInsertionPlanner } from './usePoiInsertion';
import { useTourPoiMarkers } from './useTourPoiMarkers';
import { useTourPoiSearch } from './useTourPoiSearch';

// FE-TOUR-POI-001 to FE-TOUR-POI-030

vi.mock('../planner/useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({}) }));

const ROUTE: Array<[number, number]> = [
  [47.0, 11.0],
  [47.01, 11.0],
  [47.02, 11.0],
];
const PA: TourPlannerWaypoint = { id: 'a', lat: 47.0, lng: 11.0, role: 'start' };
const PB: TourPlannerWaypoint = { id: 'b', lat: 47.01, lng: 11.0, role: 'via' };
const PC: TourPlannerWaypoint = { id: 'c', lat: 47.02, lng: 11.0, role: 'end' };
const POINTS = [PA, PB, PC];
const SPRING: TourPoi = {
  id: 'node:1',
  name: 'Spring',
  lat: 47.015,
  lng: 11.001,
  category: 'drinking_water',
  kind: 'amenity=drinking_water',
  source: 'openstreetmap',
  address: null,
  website: 'https://example.test',
  phone: null,
  opening_hours: 'Mo-Su 08:00-18:00',
  distance_m: 80,
  along_m: 1650,
};
const ANSWER: TourPoiSearchResponse = {
  pois: [SPRING],
  truncated: false,
  partial: false,
  capped: false,
  unavailable: [],
};

let search: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  useTourPoiStore.getState().clear();
  search = vi.spyOn(tourPoiSearchRepo, 'search').mockResolvedValue(ANSWER);
});
afterEach(() => vi.restoreAllMocks());

const searchPlanner = (over: Partial<TourPlannerController> = {}) =>
  ({
    tripId: 4,
    tourType: 'hike',
    route: ROUTE,
    mode: { type: 'edit-saved', placeId: 9 },
    waypoints: [],
    ...over,
  }) as TourPlannerController;

describe('useTourPoiSearch (PLN-02)', () => {
  it('FE-TOUR-POI-001: searches only when asked, with the type’s first three kinds and the corridor', async () => {
    const { result } = renderHook(() => useTourPoiSearch(searchPlanner()));
    expect(search).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual(['viewpoint', 'shelter', 'drinking_water']);
    await act(() => result.current.search());
    expect(search).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        tour_type: 'hike',
        corridor_m: 500,
        line: ROUTE,
        categories: ['viewpoint', 'shelter', 'drinking_water'],
      }),
      expect.any(AbortSignal)
    );
    expect(result.current.status).toBe('ready');
    expect(useTourPoiStore.getState().pois).toEqual([SPRING]);
  });

  it('FE-TOUR-POI-002: a change of the choices marks the answer outdated, and a kind can be dropped or added', async () => {
    const { result } = renderHook(() => useTourPoiSearch(searchPlanner()));
    await act(() => result.current.search());
    act(() => result.current.toggleCategory('viewpoint'));
    expect(result.current.categories).toEqual(['shelter', 'drinking_water']);
    expect(result.current.outdated).toBe(true);
    act(() => result.current.toggleCategory('food'));
    expect(result.current.categories).toContain('food');
  });

  it('FE-TOUR-POI-003: says when it is offline or failed, and takes the places off the map then', async () => {
    search.mockRejectedValueOnce(new OnlineOnlyError()).mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useTourPoiSearch(searchPlanner()));
    await act(() => result.current.search());
    expect(result.current.status).toBe('offline');
    await act(() => result.current.search());
    expect(result.current.status).toBe('error');
    expect(useTourPoiStore.getState().pois).toEqual([]);
  });

  it('FE-TOUR-POI-004: a paddle tour starts with its own kinds', () => {
    const { result } = renderHook(() => useTourPoiSearch(searchPlanner({ tourType: 'kayak' })));
    expect(result.current.categories).toEqual(['slipway', 'boat_rental', 'drinking_water']);
  });
});

/** A planner the insertion reads, its route and measures set by the test. */
function insertionPlanner(over: Partial<PoiInsertionPlanner> = {}): PoiInsertionPlanner {
  return {
    waypoints: POINTS,
    route: ROUTE,
    editWaypoints: vi.fn(),
    setSelectedWaypointId: vi.fn(),
    routeCurrent: true,
    status: 'ready',
    distanceMeters: 2200,
    walkingDurationMinutes: 40,
    canEdit: true,
    isSaving: false,
    undo: vi.fn(),
    canUndo: true,
    historyMark: 0,
    ...over,
  };
}

describe('usePoiInsertion (PLN-03)', () => {
  it('FE-TOUR-POI-005: suggests the point before the place and takes it in as one step after it', () => {
    const planner = insertionPlanner();
    const { result } = renderHook(() => usePoiInsertion(planner));
    expect(result.current.afterIdFor(SPRING)).toBe('b');
    act(() => {
      result.current.insert(SPRING);
    });
    expect(planner.editWaypoints).toHaveBeenCalledTimes(1);
    const updater = vi.mocked(planner.editWaypoints).mock.calls[0]?.[0] as (
      points: TourPlannerWaypoint[]
    ) => TourPlannerWaypoint[];
    expect(updater(POINTS).map((point) => point.id)).toEqual(['a', 'b', expect.any(String), 'c']);
    expect(planner.setSelectedWaypointId).toHaveBeenCalled();
  });

  it('FE-TOUR-POI-006: reads what it added only from the route planned after, and nothing once the point is gone', () => {
    let planner = insertionPlanner();
    const { result, rerender } = renderHook(() => usePoiInsertion(planner));
    act(() => {
      result.current.insert(SPRING);
    });
    const added = vi.mocked(planner.setSelectedWaypointId).mock.calls[0]?.[0] as string;
    const withPoint = [PA, PB, { id: added, lat: 47.015, lng: 11.001, role: 'via' as const }, PC];
    planner = insertionPlanner({ waypoints: withPoint, routeCurrent: false, status: 'routing' });
    rerender();
    expect(result.current.outcome).toEqual({ kind: 'measuring', name: 'Spring' });
    planner = insertionPlanner({ waypoints: withPoint, distanceMeters: 2450, walkingDurationMinutes: 46 });
    rerender();
    expect(result.current.outcome).toEqual({ kind: 'measured', name: 'Spring', extraM: 250, extraMinutes: 6 });
    planner = insertionPlanner({ waypoints: withPoint, status: 'routing-failed' });
    rerender();
    expect(result.current.outcome).toEqual({ kind: 'unmeasured', name: 'Spring' });
    planner = insertionPlanner();
    rerender();
    expect(result.current.outcome).toBeNull();
  });

  it('FE-TOUR-POI-007: takes nothing in while saving, without edit rights, or into a stretch drawn by hand', () => {
    const free: TourPlannerWaypoint[] = [
      PA,
      {
        ...PB,
        fixedLeg: {
          kind: 'free',
          geometry: [
            [47.01, 11.0],
            [47.02, 11.0],
          ],
        },
      },
      PC,
    ];
    for (const planner of [insertionPlanner({ isSaving: true }), insertionPlanner({ canEdit: false })]) {
      const { result } = renderHook(() => usePoiInsertion(planner));
      expect(result.current.insert(SPRING)).toBe(false);
      expect(planner.editWaypoints).not.toHaveBeenCalled();
    }
    const planner = insertionPlanner({ waypoints: free });
    const { result } = renderHook(() => usePoiInsertion(planner));
    act(() => result.current.chooseAfter(SPRING, 'b'));
    expect(result.current.blockOf('b')).toBe('free');
    expect(result.current.insert(SPRING)).toBe(false);
  });
});

/** The list in the side panel and the chosen place's card over the map, as the planner shows them. */
function renderAlong(planner: TourPlannerController) {
  return render(
    <>
      <TourPoiSearchCard planner={planner} />
      <TourPoiOverlay planner={planner} insetEnd={0} bottom={0} />
    </>
  );
}

describe('TourPoiSearchCard', () => {
  it('FE-TOUR-POI-008: lists what was found in one line each; a place opens its card over the map, which adds it after a point', async () => {
    const planner = {
      ...searchPlanner(),
      ...insertionPlanner(),
    } as unknown as TourPlannerController;
    renderAlong(planner);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    const row = await screen.findByTestId('tour-poi-node:1');
    expect(row).toHaveTextContent('Spring');
    expect(row).toHaveTextContent('80 m');
    expect(within(row).queryByTestId('tour-poi-add')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: /Spring/ }));
    const card = screen.getByTestId('tour-poi-overlay');
    expect(within(row).getByRole('button', { name: /Spring/ })).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveTextContent('80 m from the route');
    expect(within(card).getByText('Mo-Su 08:00-18:00')).toBeInTheDocument();
    expect(within(card).getByText('Mo-Su 08:00-18:00')).toHaveAttribute(
      'title',
      'As the source has them; check before you go.'
    );
    fireEvent.click(within(card).getByTestId('tour-poi-add'));
    await waitFor(() => expect(planner.editWaypoints).toHaveBeenCalledTimes(1));
    // The card closes once the place is in. What it did is said in the list once the route has it (FE-TOUR-POI-006).
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-016: the card over the map closes on its button and on Escape, and a pin on the map opens it too', async () => {
    const planner = { ...searchPlanner(), ...insertionPlanner() } as unknown as TourPlannerController;
    renderAlong(planner);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    await screen.findByTestId('tour-poi-node:1');

    const markers = renderHook(() => useTourPoiMarkers(), { wrapper: TranslationProvider });
    // The one place found, picked as a click on its pin does.
    for (const poi of markers.result.current.pois) act(() => markers.result.current.onPoiClick(poi));
    expect(screen.getByTestId('tour-poi-overlay')).toHaveTextContent('Spring');
    fireEvent.click(within(screen.getByTestId('tour-poi-overlay')).getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    expect(screen.getByTestId('tour-poi-overlay')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-009: names the kinds that could not be searched, and does not claim nothing was found', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [], unavailable: ['viewpoint', 'shelter'] });
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    expect(
      await screen.findByText('Could not be searched right now: Viewpoints, Huts and shelters. Try again in a moment.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Nothing found/)).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-010: an unnamed place is named by its kind in the list, on the map and once taken in', async () => {
    const tap: TourPoi = { ...SPRING, id: 'node:2', name: '' };
    search.mockResolvedValue({ ...ANSWER, pois: [tap] });
    const planner = { ...searchPlanner(), ...insertionPlanner() } as unknown as TourPlannerController;
    render(<TourPoiSearchCard planner={planner} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    const row = await screen.findByTestId('tour-poi-node:2');
    expect(within(row).getByRole('button', { name: /Drinking water/ })).toBeInTheDocument();

    const markers = renderHook(() => useTourPoiMarkers(), { wrapper: TranslationProvider });
    expect(markers.result.current.pois.map((poi) => poi.name)).toEqual(['Drinking water']);

    let taking = insertionPlanner();
    const { result, rerender } = renderHook(() => usePoiInsertion(taking), { wrapper: TranslationProvider });
    act(() => {
      result.current.insert(tap);
    });
    const added = vi.mocked(taking.setSelectedWaypointId).mock.calls[0]?.[0] as string;
    const withPoint = [PA, PB, { id: added, lat: tap.lat, lng: tap.lng, role: 'via' as const }, PC];
    taking = insertionPlanner({ waypoints: withPoint, routeCurrent: false, status: 'routing' });
    rerender();
    expect(result.current.outcome).toEqual({ kind: 'measuring', name: 'Drinking water' });
  });
});

describe('highlights along a tour', () => {
  const SQUARE: TourPoi = {
    ...SPRING,
    id: 'way:1',
    name: 'Piazza San Marco',
    category: 'sights',
    kind: 'place=square',
    opening_hours: null,
    website: null,
    highlight: true,
  };

  it('FE-TOUR-POI-017: a highlight carries a star before its name in the list, a place that is none carries none', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [SQUARE, SPRING] });
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    const square = await screen.findByTestId('tour-poi-way:1');
    const star = within(square).getByTestId('tour-poi-highlight');
    expect(star).toHaveAttribute('aria-label', 'Highlight');
    expect(star).toHaveAttribute('title', 'One of the best-known places here');
    expect(within(square).getByRole('button', { name: /Highlight.*Piazza San Marco/ })).toBeInTheDocument();
    expect(within(screen.getByTestId('tour-poi-node:1')).queryByTestId('tour-poi-highlight')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-018: the card over the map says Highlight beside the kind, and only for a highlight', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [SQUARE, SPRING] });
    const planner = { ...searchPlanner(), ...insertionPlanner() } as unknown as TourPlannerController;
    renderAlong(planner);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    fireEvent.click(within(await screen.findByTestId('tour-poi-way:1')).getByRole('button', { name: /Piazza/ }));
    const badge = within(screen.getByTestId('tour-poi-overlay')).getByTestId('tour-poi-highlight-badge');
    expect(badge).toHaveTextContent('Highlight');
    expect(badge).toHaveAttribute('title', 'One of the best-known places here');
    expect(screen.getByTestId('tour-poi-overlay')).toHaveTextContent('Sights');

    fireEvent.click(within(screen.getByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    expect(screen.queryByTestId('tour-poi-highlight-badge')).not.toBeInTheDocument();
  });
});

describe('a city walk along its places (CW-05)', () => {
  const CAFE: TourPoi = {
    ...SPRING,
    id: 'node:3',
    name: 'Cafe Luitpold',
    category: 'cafe',
    kind: 'amenity=cafe',
    opening_hours: null,
  };
  const walkPlanner = () =>
    ({ ...searchPlanner({ tourType: 'walk' }), ...insertionPlanner() }) as unknown as TourPlannerController;
  const themeButton = (theme: string) => screen.getByTestId(`tour-poi-theme-${theme}`);

  it('FE-TOUR-POI-011: a walk offers four themes; one sets its categories at once, a change of them leaves it', async () => {
    const planner = walkPlanner();
    render(<TourPoiSearchCard planner={planner} />);
    const themes = screen.getByTestId('tour-poi-themes');
    expect(
      within(themes)
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['Culture and history', 'Parks and views', 'Food and local life', 'A bit of everything']);
    // The walk starts with its first three categories, which no theme is.
    for (const theme of ['culture', 'parks', 'food', 'mixed'])
      expect(themeButton(theme)).toHaveAttribute('aria-pressed', 'false');
    // What a theme looks for is said on the button, not in a line of its own.
    expect(themeButton('food')).toHaveAttribute('title', 'Coffee shops, places to eat and markets along the route.');

    fireEvent.click(themeButton('food'));
    expect(themeButton('food')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('tour-poi-categories')).toHaveTextContent('Coffee shops, Places to eat +1');
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    await waitFor(() =>
      expect(search).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ tour_type: 'walk', categories: ['cafe', 'restaurant', 'market'] }),
        expect.any(AbortSignal)
      )
    );

    fireEvent.click(screen.getByTestId('tour-poi-categories'));
    fireEvent.click(screen.getByRole('button', { name: 'Markets' }));
    expect(themeButton('food')).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-TOUR-POI-012: the category field names two categories, counts the rest, and says when none is chosen', () => {
    render(<TourPoiSearchCard planner={walkPlanner()} />);
    const field = screen.getByTestId('tour-poi-categories');
    expect(field).toHaveTextContent('Sights, Museums and galleries +1');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(field);
    expect(field).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('group', { name: 'What to look for' });
    fireEvent.click(within(list).getByRole('button', { name: 'Parks and gardens' }));
    expect(field).toHaveTextContent('Sights, Museums and galleries');
    expect(field).not.toHaveTextContent('+1');
    fireEvent.click(within(list).getByRole('button', { name: 'Sights' }));
    fireEvent.click(within(list).getByRole('button', { name: 'Museums and galleries' }));
    expect(field).toHaveTextContent('No category chosen');
    expect(screen.getByTestId('tour-poi-search')).toBeDisabled();
  });

  it('FE-TOUR-POI-013: a place found for a theme says which theme suggested it', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [CAFE, SPRING] });
    renderAlong(walkPlanner());
    fireEvent.click(themeButton('food'));
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    const cafe = await screen.findByTestId('tour-poi-node:3');
    fireEvent.click(within(cafe).getByRole('button', { name: /Cafe Luitpold/ }));
    expect(
      within(screen.getByTestId('tour-poi-overlay')).getByText('Suggested for Food and local life')
    ).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    expect(screen.queryByText('Suggested for Food and local life')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-014: a hike has no themes', () => {
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    expect(screen.queryByTestId('tour-poi-themes')).not.toBeInTheDocument();
    expect(screen.getByTestId('tour-poi-categories')).toHaveTextContent('Viewpoints, Huts and shelters +1');
  });

  it('FE-TOUR-POI-015: a place taken in keeps its name and opening hours, and a place without them adds none', () => {
    const planner = insertionPlanner();
    const { result } = renderHook(() => usePoiInsertion(planner), { wrapper: TranslationProvider });
    act(() => {
      result.current.insert(SPRING);
    });
    act(() => {
      result.current.insert({ ...CAFE, id: 'node:4', name: '', along_m: 400 });
    });
    const added = vi
      .mocked(planner.editWaypoints)
      .mock.calls.map(
        ([update]) =>
          (update as (points: TourPlannerWaypoint[]) => TourPlannerWaypoint[])(POINTS).find(
            (point) => !POINTS.includes(point)
          ) as TourPlannerWaypoint
      );
    expect(added[0]).toMatchObject({
      name: 'Spring',
      openingHours: 'Mo-Su 08:00-18:00',
      poiCategory: 'drinking_water',
    });
    // PLN-03: the kind the place was found as goes with it, so its row carries the kind's icon.
    expect(added[1]).toMatchObject({ poiCategory: 'cafe' });
    expect(added[1]).not.toHaveProperty('name');
    expect(added[1]).not.toHaveProperty('openingHours');
  });
});

describe('choosing where a found place goes (PLN-04)', () => {
  const alongPlanner = (over: Partial<PoiInsertionPlanner> = {}) =>
    ({ ...searchPlanner(), ...insertionPlanner(over) }) as unknown as TourPlannerController;
  async function openCard(planner: TourPlannerController) {
    renderAlong(planner);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    fireEvent.click(within(await screen.findByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    return screen.getByTestId('tour-poi-overlay');
  }
  /** A press as a real pointer makes it: down, then the click. */
  function press(element: HTMLElement) {
    fireEvent.pointerDown(element);
    fireEvent.mouseDown(element);
    fireEvent.click(element);
  }

  it('FE-TOUR-POI-019: the last point picked as the position keeps the card open, and adding makes exactly one new end', async () => {
    const planner = alongPlanner();
    const card = await openCard(planner);
    const slot = within(card).getByTestId('tour-poi-slot');
    expect(slot).toHaveTextContent('Between Waypoint 2 and Waypoint 3');
    press(slot);
    const list = screen.getByRole('group', { name: 'Where it goes' });
    expect(
      within(list)
        .getAllByRole('button')
        .map((option) => option.textContent)
    ).toEqual([
      expect.stringContaining('Between Waypoint 1 and Waypoint 2'),
      expect.stringContaining('Between Waypoint 2 and Waypoint 3'),
      expect.stringContaining('As the new end'),
    ]);
    const newEnd = within(list).getByRole('button', { name: /As the new end/ });
    expect(newEnd).toHaveTextContent('Extends the tour');
    press(newEnd);

    expect(screen.getByTestId('tour-poi-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('tour-poi-slot')).toHaveTextContent('As the new end');
    expect(screen.getByTestId('tour-poi-slot-extends')).toHaveTextContent(
      'Waypoint 3 is no longer the end: the tour goes on to this place.'
    );
    expect(planner.editWaypoints).not.toHaveBeenCalled();

    press(screen.getByTestId('tour-poi-add'));
    expect(planner.editWaypoints).toHaveBeenCalledTimes(1);
    const updater = vi.mocked(planner.editWaypoints).mock.calls[0]?.[0] as (
      points: TourPlannerWaypoint[]
    ) => TourPlannerWaypoint[];
    const next = normalizePlannerWaypoints(updater(POINTS));
    expect(next).toHaveLength(POINTS.length + 1);
    expect(next.map((point) => point.id).slice(0, 3)).toEqual(['a', 'b', 'c']);
    expect(next.map((point) => point.role)).toEqual(['start', 'via', 'via', 'end']);
    expect(next[3]).toMatchObject({ lat: SPRING.lat, lng: SPRING.lng, name: 'Spring' });
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-020: closing, Escape or a press outside leaves the tour alone, the picked slot with it', async () => {
    const planner = alongPlanner();
    const card = await openCard(planner);
    press(within(card).getByTestId('tour-poi-slot'));
    press(within(screen.getByRole('group', { name: 'Where it goes' })).getByRole('button', { name: /As the new end/ }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId('tour-poi-overlay')).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    // Opened again, the place still goes where it was put.
    expect(screen.getByTestId('tour-poi-slot')).toHaveTextContent('As the new end');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(within(screen.getByTestId('tour-poi-node:1')).getByRole('button', { name: /Spring/ }));
    fireEvent.click(within(screen.getByTestId('tour-poi-overlay')).getByRole('button', { name: 'Close' }));
    expect(planner.editWaypoints).not.toHaveBeenCalled();
    expect(planner.setSelectedWaypointId).not.toHaveBeenCalled();
  });

  it('FE-TOUR-POI-021: the notice of what was added takes it back with undo, only while that is the last step', async () => {
    const added: TourPlannerWaypoint = { id: 'new', lat: SPRING.lat, lng: SPRING.lng, role: 'end' };
    const withPoint = [PA, PB, { ...PC, role: 'via' as const }, added];
    useTourPoiStore.getState().setInserted({
      pointId: 'new',
      name: 'Spring',
      before: { distanceM: 2200, minutes: 40 },
      pointCount: 4,
      mark: 0,
    });
    const planner = alongPlanner({ waypoints: withPoint, distanceMeters: 2900, walkingDurationMinutes: 52 });
    const { unmount } = render(<TourPoiSearchCard planner={planner} />);
    const notice = screen.getByTestId('tour-poi-outcome');
    expect(notice).toHaveTextContent('+700 m');
    fireEvent.click(within(notice).getByTestId('tour-poi-undo'));
    expect(planner.undo).toHaveBeenCalledTimes(1);
    expect(useTourPoiStore.getState().inserted).toBeNull();
    unmount();

    // With nothing to undo, or no right to edit, the notice offers no way back.
    useTourPoiStore.getState().setInserted({
      pointId: 'new',
      name: 'Spring',
      before: { distanceM: 2200, minutes: 40 },
      pointCount: 4,
      mark: 0,
    });
    render(<TourPoiSearchCard planner={alongPlanner({ waypoints: withPoint, canUndo: false })} />);
    expect(screen.getByTestId('tour-poi-outcome')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-undo')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-022: a later step that keeps the point count takes the undo away, so it never reverts that step', () => {
    let planner = insertionPlanner({ historyMark: 3 });
    const { result, rerender } = renderHook(() => usePoiInsertion(planner));
    act(() => {
      result.current.insert(SPRING);
    });
    const added = vi.mocked(planner.setSelectedWaypointId).mock.calls[0]?.[0] as string;
    const withPoint = [PA, PB, { id: added, lat: 47.015, lng: 11.001, role: 'via' as const }, PC];
    planner = insertionPlanner({ waypoints: withPoint, historyMark: 4 });
    rerender();
    expect(result.current.undo).not.toBeNull();
    // The new point dragged, or the tour renamed: still four points, but no longer the last step.
    planner = insertionPlanner({ waypoints: withPoint, historyMark: 5 });
    rerender();
    expect(result.current.outcome).not.toBeNull();
    expect(result.current.undo).toBeNull();
  });
});

describe('a search that could not ask, and its retry (PLN-05)', () => {
  const NO_VIEWPOINTS: TourPoiSearchResponse = { ...ANSWER, pois: [], unavailable: ['viewpoint'] };

  it('FE-TOUR-POI-023: counts down the wait the server named with the viewpoints it could not search, then asks afresh', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    try {
      search.mockResolvedValueOnce({ ...NO_VIEWPOINTS, retry_after_s: 3 });
      const { result } = renderHook(() => useTourPoiSearch(searchPlanner()));
      await act(() => result.current.search());
      expect(result.current.answer?.unavailable).toEqual(['viewpoint']);
      expect(result.current.retryInS).toBe(3);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.retryInS).toBe(2);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.retryInS).toBe(0);

      await act(() => result.current.search());
      expect(search).toHaveBeenCalledTimes(2);
      expect(search.mock.calls[1]?.[1]).toEqual(search.mock.calls[0]?.[1]);
      expect(result.current.answer).toEqual(ANSWER);
      expect(result.current.retryInS).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-TOUR-POI-024: Try again beside the viewpoints asks afresh, and its places replace the note, the tour untouched', async () => {
    search.mockResolvedValueOnce(NO_VIEWPOINTS).mockResolvedValueOnce(ANSWER);
    const planner = { ...searchPlanner(), ...insertionPlanner() } as unknown as TourPlannerController;
    render(<TourPoiSearchCard planner={planner} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));

    const retry = await screen.findByTestId('tour-poi-retry');
    expect(retry).toHaveTextContent('Try again');
    expect(screen.getByText(/Could not be searched right now: Viewpoints/)).toBeInTheDocument();
    expect(screen.queryByText(/Nothing found/)).not.toBeInTheDocument();
    fireEvent.click(retry);

    expect(await screen.findByTestId('tour-poi-node:1')).toBeInTheDocument();
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1]?.[1]).toMatchObject({
      corridor_m: 500,
      categories: expect.arrayContaining(['viewpoint']),
    });
    expect(screen.queryByText(/Could not be searched/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-retry')).not.toBeInTheDocument();
    expect(planner.editWaypoints).not.toHaveBeenCalled();
  });

  it('FE-TOUR-POI-025: a failed request keeps a retry that works, one held by a named wait does not ask early', async () => {
    search
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce({ ...NO_VIEWPOINTS, retry_after_s: 20 })
      .mockResolvedValueOnce(ANSWER);
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    expect(await screen.findByText('The search did not work. Try again in a moment.')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tour-poi-retry'));
    await waitFor(() => expect(screen.getByTestId('tour-poi-retry')).toHaveTextContent('Again in 0:20'));
    const held = screen.getByTestId('tour-poi-retry');
    expect(held).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(held);
    expect(search).toHaveBeenCalledTimes(2);
    // The search button itself is never held: changed choices are asked at once.
    expect(screen.getByTestId('tour-poi-search')).toBeEnabled();
  });

  it('FE-TOUR-POI-026: nothing found offers the next wider corridor in one press, and none past the widest', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [] });
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    expect(await screen.findByText(/Nothing found within/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tour-poi-widen'));
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
    expect(search.mock.calls[1]?.[1]).toMatchObject({ corridor_m: 1000 });
    await waitFor(() => expect(screen.getByTestId('tour-poi-search')).not.toHaveAttribute('data-outdated'));

    fireEvent.click(await screen.findByTestId('tour-poi-widen'));
    await waitFor(() => expect(search).toHaveBeenCalledTimes(3));
    expect(search.mock.calls[2]?.[1]).toMatchObject({ corridor_m: 2000 });
    await waitFor(() => expect(screen.getByTestId('tour-poi-search')).toBeEnabled());
    expect(screen.queryByTestId('tour-poi-widen')).not.toBeInTheDocument();
  });

  it('FE-TOUR-POI-027: an empty answer with stretches left out offers a retry, never nothing found or a wider corridor', async () => {
    search.mockResolvedValue({ ...ANSWER, pois: [], partial: true });
    render(<TourPoiSearchCard planner={searchPlanner()} />);
    fireEvent.click(screen.getByTestId('tour-poi-search'));

    expect(await screen.findByText(/Some stretches could not be searched/)).toBeInTheDocument();
    expect(screen.getByTestId('tour-poi-retry')).toHaveTextContent('Try again');
    expect(screen.queryByText(/Nothing found/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-widen')).not.toBeInTheDocument();
  });
});

describe('e-bike charging along a bike tour (BIK-07)', () => {
  const CHARGER: TourPoi = {
    ...SPRING,
    id: 'node:5',
    name: '',
    category: 'ebike_charging',
    kind: 'amenity=charging_station&bicycle=designated',
    website: null,
    opening_hours: null,
    charging: {
      bicycle: 'designated',
      sockets: [{ type: 'schuko', count: 2, kw: null }],
      capacity: null,
      fee: false,
      access: null,
    },
  };
  const bikePlanner = (over: Partial<PoiInsertionPlanner> = {}) =>
    ({ ...searchPlanner({ tourType: 'bike' }), ...insertionPlanner(over) }) as unknown as TourPlannerController;

  it('FE-TOUR-POI-028: offered to a bike tour beside its first three, its card shows what the point states and adds it as a stop', async () => {
    const { result } = renderHook(() => useTourPoiSearch(searchPlanner({ tourType: 'bike' })));
    expect(result.current.offered).toContain('ebike_charging');
    expect(result.current.categories).toEqual(['drinking_water', 'bike_repair', 'food']);
    act(() => result.current.toggleCategory('ebike_charging'));
    await act(() => result.current.search());
    expect(search.mock.calls[0]?.[1]).toMatchObject({ categories: expect.arrayContaining(['ebike_charging']) });

    useTourPoiStore.getState().clear();
    search.mockResolvedValue({ ...ANSWER, pois: [CHARGER] });
    const planner = bikePlanner();
    renderAlong(planner);
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    const row = await screen.findByTestId('tour-poi-node:5');
    // Mapped without a name, it is named by its kind.
    fireEvent.click(within(row).getByRole('button', { name: /E-bike charging/ }));
    const facts = within(screen.getByTestId('tour-poi-overlay')).getByTestId('tour-poi-charging');
    expect(facts).toHaveTextContent('Made for e-bikes');
    expect(facts).toHaveTextContent('Schuko ×2');
    expect(facts).toHaveTextContent('Free');
    // Nothing said about access or room is shown as nothing, not as a guess.
    expect(facts).not.toHaveTextContent('Open to all');
    expect(facts).not.toHaveTextContent('Charging spots');
    expect(within(facts).queryByTestId('tour-poi-charging-no-socket')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tour-poi-add'));
    await waitFor(() => expect(planner.editWaypoints).toHaveBeenCalledTimes(1));
    const updater = vi.mocked(planner.editWaypoints).mock.calls[0]?.[0] as (
      points: TourPlannerWaypoint[]
    ) => TourPlannerWaypoint[];
    const added = normalizePlannerWaypoints(updater(POINTS)).find((point) => point.lat === CHARGER.lat);
    // Unnamed, it keeps no name of its own, as every unnamed place does; its row shows the kind.
    expect(added).toMatchObject({ lng: CHARGER.lng, poiCategory: 'ebike_charging' });
    expect(added).not.toHaveProperty('name');
  });

  it('FE-TOUR-POI-029: a point that only lets bikes charge says so, and an unstated plug is dimmed, never named', async () => {
    const plain: TourPoi = {
      ...CHARGER,
      charging: { bicycle: 'yes', sockets: [], capacity: 3, fee: null, access: 'customers' },
    };
    search.mockResolvedValue({ ...ANSWER, pois: [plain] });
    renderAlong(bikePlanner());
    fireEvent.click(screen.getByTestId('tour-poi-search'));
    fireEvent.click(within(await screen.findByTestId('tour-poi-node:5')).getByRole('button'));
    const facts = screen.getByTestId('tour-poi-charging');
    expect(facts).toHaveTextContent('E-bikes may charge');
    expect(facts).not.toHaveTextContent('Made for e-bikes');
    expect(within(facts).getByTestId('tour-poi-charging-no-socket')).toHaveClass('opacity-60');
    expect(facts).toHaveTextContent('Plug not stated');
    expect(facts).toHaveTextContent('Customers only');
    expect(facts).toHaveTextContent('Charging spots3');
    expect(facts).not.toHaveTextContent('Free');
    expect(facts).not.toHaveTextContent('Schuko');
  });

  it('FE-TOUR-POI-030: chargers asked for and none found says few are mapped, with the wider corridor one press away', async () => {
    render(<TourPoiSearchCard planner={searchPlanner({ tourType: 'bike' })} />);
    fireEvent.click(screen.getByTestId('tour-poi-categories'));
    const list = screen.getByRole('group', { name: 'What to look for' });
    fireEvent.click(within(list).getByRole('button', { name: 'E-bike charging' }));
    fireEvent.click(screen.getByTestId('tour-poi-search'));

    // Other places found, no charger: the note and the wider corridor, not nothing found.
    const note = await screen.findByTestId('tour-poi-charging-few');
    expect(note).toHaveTextContent('Few charging points are mapped for e-bikes yet.');
    expect(within(note).getByTestId('tour-poi-widen')).toHaveTextContent('Widen to');
    expect(screen.queryByText(/Nothing found/)).not.toBeInTheDocument();

    // Nothing at all: nothing found with its own wider corridor, the note beside it without a second one.
    search.mockResolvedValue({ ...ANSWER, pois: [] });
    fireEvent.click(screen.getByTestId('tour-poi-widen'));
    expect(await screen.findByText(/Nothing found within/)).toBeInTheDocument();
    expect(screen.getByTestId('tour-poi-charging-few')).toBeInTheDocument();
    expect(screen.getAllByTestId('tour-poi-widen')).toHaveLength(1);

    // Chargers that could not be searched are named as such, never as few mapped.
    search.mockResolvedValue({ ...ANSWER, pois: [], unavailable: ['ebike_charging'] });
    fireEvent.click(screen.getByTestId('tour-poi-widen'));
    expect(await screen.findByText(/Could not be searched right now: E-bike charging/)).toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-charging-few')).not.toBeInTheDocument();

    // A cut answer may have lost the chargers to the cut: its own note says so, not few mapped.
    search.mockResolvedValue({ ...ANSWER, truncated: true });
    fireEvent.click(screen.getByTestId('tour-poi-retry'));
    expect(await screen.findByText(/There are more places than shown/)).toBeInTheDocument();
    expect(screen.queryByTestId('tour-poi-charging-few')).not.toBeInTheDocument();
  });
});
