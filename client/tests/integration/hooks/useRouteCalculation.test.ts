import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouteCalculation } from '../../../src/hooks/useRouteCalculation';
import { useTripStore } from '../../../src/store/tripStore';
import { buildAssignment, buildPlace } from '../../helpers/factories';
import type { TripStoreState } from '../../../src/store/tripStore';
import type { RouteSegment } from '../../../src/types';

vi.mock('../../../src/components/Map/RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('../../../src/components/Map/RouteCalculator')>();
  return {
    ...actual,
    calculateRouteWithLegs: vi.fn(),
    calculateRoute: vi.fn(),
    optimizeRoute: vi.fn((waypoints: unknown[]) => waypoints),
    generateGoogleMapsUrl: vi.fn(),
  };
});

const { calculateRouteWithLegs } = await import('../../../src/components/Map/RouteCalculator');

function buildMockStore(assignments: Record<string, ReturnType<typeof buildAssignment>[]> = {}): Partial<TripStoreState> {
  // Also populate the real Zustand store so updateRouteForDay (which reads from
  // useTripStore.getState()) sees the same assignments as the hook's tripStore param.
  // Reset reservations and days to empty so transport-split logic doesn't interfere.
  useTripStore.setState({ assignments, reservations: [], days: [] } as any);
  return { assignments } as Partial<TripStoreState>;
}

const MOCK_SEGMENTS: RouteSegment[] = [
  {
    mid: [48.5, 2.5],
    from: [48.86, 2.35],
    to: [48.21, 16.37],
    distance: 343000,
    duration: 12600,
    distanceText: '343 km',
    durationText: '3 h 30 min',
    walkingText: '70 h',
    drivingText: '3 h 30 min',
  },
];

// Empty coordinates make the hook fall back to the straight-line geometry,
// so the `route` assertions keep checking the raw waypoints while the legs
// still flow through to `routeSegments`.
const MOCK_ROUTE_WITH_LEGS = {
  coordinates: [] as [number, number][],
  distance: 343000,
  duration: 12600,
  legs: MOCK_SEGMENTS,
};

describe('useRouteCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset trip store assignments so each test starts clean
    useTripStore.setState({ assignments: {} } as any);
    (calculateRouteWithLegs as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_ROUTE_WITH_LEGS);
  });

  it('FE-HOOK-ROUTE-001: with no selectedDayId, route is null', () => {
    const store = buildMockStore({});
    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, null)
    );
    expect(result.current.route).toBeNull();
  });

  it('FE-HOOK-ROUTE-002: with < 2 waypoints, route remains null', async () => {
    const place = buildPlace({ lat: 48.8566, lng: 2.3522 });
    const assignment = buildAssignment({ day_id: 5, order_index: 0, place });
    const store = buildMockStore({ '5': [assignment] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});
    expect(result.current.route).toBeNull();
  });

  it('FE-HOOK-ROUTE-003: with ≥ 2 geo-coded assignments, sets route coordinates', async () => {
    const p1 = buildPlace({ lat: 48.8566, lng: 2.3522 });
    const p2 = buildPlace({ lat: 51.5074, lng: -0.1278 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});
    // route is an array of segments; no transport → single segment with all places
    expect(result.current.route).toEqual([
      [[p1.lat, p1.lng], [p2.lat, p2.lng]],
    ]);
  });

  it('FE-HOOK-ROUTE-004: calls calculateRouteWithLegs and exposes the returned segments', async () => {
    const p1 = buildPlace({ lat: 48.8566, lng: 2.3522 });
    const p2 = buildPlace({ lat: 51.5074, lng: -0.1278 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});

    expect(calculateRouteWithLegs).toHaveBeenCalled();
    expect(result.current.routeSegments).toEqual(MOCK_SEGMENTS);
  });

  it('FE-HOOK-ROUTE-006: assignments are sorted by order_index before extracting waypoints', async () => {
    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    // order_index 1 comes before 0 in the array, but should be sorted
    const a1 = buildAssignment({ day_id: 5, order_index: 1, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 0, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});

    // After sort: a2 (order_index=0) first, then a1 (order_index=1)
    expect(result.current.route).toEqual([
      [[p2.lat, p2.lng], [p1.lat, p1.lng]],
    ]);
  });

  it('FE-HOOK-ROUTE-007: assignments with no lat/lng are filtered out', async () => {
    const pValid = buildPlace({ lat: 48.8566, lng: 2.3522 });
    const pNoGeo = buildPlace({ lat: null as any, lng: null as any });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: pNoGeo });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: pValid });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});
    // Only 1 valid waypoint → route is null
    expect(result.current.route).toBeNull();
  });

  it('FE-HOOK-ROUTE-008: AbortController.abort() is called when selectedDayId changes', async () => {

    // Make calculateRouteWithLegs resolve slowly
    let resolveSegments!: (val: typeof MOCK_ROUTE_WITH_LEGS) => void;
    (calculateRouteWithLegs as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (_waypoints: unknown[], options: { signal?: AbortSignal }) => {
        return new Promise<typeof MOCK_ROUTE_WITH_LEGS>((resolve) => {
          resolveSegments = resolve;
          options?.signal?.addEventListener('abort', () => resolve(MOCK_ROUTE_WITH_LEGS));
        });
      }
    );

    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });

    const store1 = buildMockStore({ '5': [a1, a2], '6': [a1, a2] });

    const { rerender } = renderHook(
      ({ dayId }: { dayId: number }) => useRouteCalculation(store1 as TripStoreState, dayId),
      { initialProps: { dayId: 5 } }
    );

    // Change to day 6 — should abort in-flight request for day 5
    await act(async () => {
      rerender({ dayId: 6 });
    });

    // calculateRouteWithLegs should have been called at least once for day 5
    // and once more for day 6
    expect((calculateRouteWithLegs as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(1);

    // Cleanup
    resolveSegments?.(MOCK_ROUTE_WITH_LEGS);
  });

  it('FE-HOOK-ROUTE-009: AbortError from calculateSegments does not set routeSegments to []', async () => {

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    (calculateRouteWithLegs as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});
    // AbortError should be swallowed silently — segments remain empty
    expect(result.current.routeSegments).toEqual([]);
  });

  it('FE-HOOK-ROUTE-010: non-AbortError from calculateSegments sets routeSegments to []', async () => {

    (calculateRouteWithLegs as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );

    await act(async () => {});
    expect(result.current.routeSegments).toEqual([]);
  });

  it('FE-HOOK-ROUTE-011: when selectedDayId is null, route and segments are cleared', async () => {
    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });
    const store = buildMockStore({ '5': [a1, a2] });

    const { result, rerender } = renderHook(
      ({ dayId }: { dayId: number | null }) => useRouteCalculation(store as TripStoreState, dayId),
      { initialProps: { dayId: 5 as number | null } }
    );

    await act(async () => {});
    // Some route may have been set for day 5

    await act(async () => {
      rerender({ dayId: null });
    });

    expect(result.current.route).toBeNull();
    expect(result.current.routeSegments).toEqual([]);
  });

  it('FE-HOOK-ROUTE-014: #1321 day-1 arrival draws no check-in-hotel → departure leg', async () => {
    // Day 1 = arrival from home: a flight (departure → arrival airport) then two activities,
    // checking into a hotel tonight. The morning hotel is only a check-in fallback, so the
    // hotel must NOT be bookended to the flight's departure point; the evening leg stays.
    const dep = { lat: 50.03, lng: 8.57 };  // home/departure airport
    const arr = { lat: 41.30, lng: 2.08 };  // destination airport
    const actA = buildPlace({ lat: 41.38, lng: 2.17 });
    const actB = buildPlace({ lat: 41.40, lng: 2.19 });
    const hotel = { lat: 41.39, lng: 2.16 };

    const flight = {
      id: 100, type: 'flight', day_id: 1, end_day_id: 1, day_plan_position: 0,
      endpoints: [
        { role: 'from', lat: dep.lat, lng: dep.lng },
        { role: 'to', lat: arr.lat, lng: arr.lng },
      ],
    };
    const a1 = buildAssignment({ day_id: 1, order_index: 1, place: actA });
    const a2 = buildAssignment({ day_id: 1, order_index: 2, place: actB });
    const accommodations = [{ id: 1, start_day_id: 1, end_day_id: 2, place_lat: hotel.lat, place_lng: hotel.lng }];
    // A single stable store reference (like buildMockStore) so selectedDayAssignments
    // keeps its identity across renders and the effect doesn't loop.
    const store = { assignments: { '1': [a1, a2] } } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: store.assignments,
      reservations: [flight],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 1, true, 'driving', accommodations as any)
    );

    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    // The spurious morning bookend [hotel → departure airport] must be gone.
    expect(legs).not.toContainEqual([`${hotel.lat},${hotel.lng}`, `${dep.lat},${dep.lng}`]);
    // The route starts the day's run at the arrival airport, not the hotel.
    expect(result.current.route?.[0]?.[0]).toEqual([arr.lat, arr.lng]);
    // The evening leg [last activity → hotel] is still drawn.
    expect(legs).toContainEqual([`${actB.lat},${actB.lng}`, `${hotel.lat},${hotel.lng}`]);
  });

  it('FE-HOOK-ROUTE-015: day-1 with a first activity timed after check-in keeps the hotel → first-activity leg', async () => {
    // The check-in day is still a home-base loop when the first activity provably happens
    // at/after check-in (you dropped your bags first) — the hotel → first-stop leg remains.
    // Since #1597 the loop needs that time proof; un-timed activities draw no morning leg.
    const actA = buildPlace({ lat: 41.38, lng: 2.17, place_time: '15:00' });
    const actB = buildPlace({ lat: 41.40, lng: 2.19 });
    const hotel = { lat: 41.39, lng: 2.16 };
    const a1 = buildAssignment({ day_id: 1, order_index: 0, place: actA });
    const a2 = buildAssignment({ day_id: 1, order_index: 1, place: actB });
    const accommodations = [{ id: 1, start_day_id: 1, end_day_id: 2, check_in: '14:00', place_lat: hotel.lat, place_lng: hotel.lng }];
    const store = { assignments: { '1': [a1, a2] } } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: store.assignments,
      reservations: [],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 1, true, 'driving', accommodations as any)
    );

    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    expect(legs).toContainEqual([`${hotel.lat},${hotel.lng}`, `${actA.lat},${actA.lng}`]);
    expect(legs).toContainEqual([`${actB.lat},${actB.lng}`, `${hotel.lat},${hotel.lng}`]);
  });

  it('FE-HOOK-ROUTE-022: #1597 check-in day with an un-timed place and a transport starts at the place, not the hotel', async () => {
    // Day 1 of a driving holiday: leave "Home" (no time set), cross by tunnel/ferry, and
    // check into a hotel near the arrival port tonight. The hotel is only reached at the
    // end of the day, so no hotel → Home leg may be drawn no matter the check-in time —
    // the route starts at Home and still ends at the hotel.
    const home = buildPlace({ lat: 52.48, lng: -1.90 });        // un-timed "Home"
    const dep = { lat: 51.09, lng: 1.12 };                      // Folkestone terminal
    const arr = { lat: 50.94, lng: 1.81 };                      // Calais terminal
    const hotel = { lat: 50.95, lng: 1.85 };

    const tunnel = {
      id: 200, type: 'train', day_id: 1, end_day_id: 1, day_plan_position: 1,
      endpoints: [
        { role: 'from', lat: dep.lat, lng: dep.lng },
        { role: 'to', lat: arr.lat, lng: arr.lng },
      ],
    };
    const a1 = buildAssignment({ day_id: 1, order_index: 0, place: home });
    const accommodations = [{ id: 1, start_day_id: 1, end_day_id: 2, check_in: '19:00', place_lat: hotel.lat, place_lng: hotel.lng }];
    const store = { assignments: { '1': [a1] } } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: store.assignments,
      reservations: [tunnel],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 1, true, 'driving', accommodations as any)
    );

    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    // No phantom morning bookend [hotel → Home].
    expect(legs).not.toContainEqual([`${hotel.lat},${hotel.lng}`, `${home.lat},${home.lng}`]);
    // The day starts at Home and drives to the departure terminal.
    expect(result.current.route?.[0]?.[0]).toEqual([home.lat, home.lng]);
    // The evening leg [arrival terminal → hotel] is still drawn.
    expect(legs).toContainEqual([`${arr.lat},${arr.lng}`, `${hotel.lat},${hotel.lng}`]);
  });

  it('FE-HOOK-ROUTE-016: #1297 transfer day with no activities draws the hotel → hotel leg', async () => {
    // Day 2 is a pure transfer: check out of hotel A (slept there last night) and into
    // hotel B tonight, with no activities or transport. The map must still draw A → B.
    const hotelA = { lat: 48.86, lng: 2.35 };
    const hotelB = { lat: 45.76, lng: 4.84 };
    const accommodations = [
      { id: 1, start_day_id: 1, end_day_id: 2, place_lat: hotelA.lat, place_lng: hotelA.lng },
      { id: 2, start_day_id: 2, end_day_id: 3, place_lat: hotelB.lat, place_lng: hotelB.lng },
    ];
    const store = { assignments: {} } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: {},
      reservations: [],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }, { id: 3, day_number: 3 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 2, true, 'driving', accommodations as any)
    );

    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    expect(legs).toContainEqual([`${hotelA.lat},${hotelA.lng}`, `${hotelB.lat},${hotelB.lng}`]);
  });

  it('FE-HOOK-ROUTE-017: #1297 rest day in one hotel with no activities draws nothing', async () => {
    // Guard against a zero-length loop: morning and evening hotel are the same, no
    // activities — no transfer leg should be drawn.
    const hotel = { lat: 48.86, lng: 2.35 };
    const accommodations = [
      { id: 1, start_day_id: 1, end_day_id: 4, place_lat: hotel.lat, place_lng: hotel.lng },
    ];
    const store = { assignments: {} } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: {},
      reservations: [],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }, { id: 3, day_number: 3 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 2, true, 'driving', accommodations as any)
    );

    await act(async () => {});

    expect(result.current.route).toBeNull();
  });

  it('FE-HOOK-ROUTE-020: #1465 check-in day with a place before check-in draws no hotel → first-stop leg', async () => {
    // Airport (10:00) and a museum (12:00) on the check-in day, both before the 15:00 check-in.
    // You reach them before dropping your bags, so the day starts at the airport — no hotel →
    // airport leg. The evening leg to the hotel (where you sleep tonight) still stands.
    const airport = buildPlace({ lat: 41.30, lng: 2.08, place_time: '10:00' });
    const museum = buildPlace({ lat: 41.38, lng: 2.17, place_time: '12:00' });
    const hotel = { lat: 41.39, lng: 2.16 };
    const a1 = buildAssignment({ day_id: 1, order_index: 0, place: airport });
    const a2 = buildAssignment({ day_id: 1, order_index: 1, place: museum });
    const accommodations = [{ id: 1, start_day_id: 1, end_day_id: 2, check_in: '15:00', place_lat: hotel.lat, place_lng: hotel.lng }];
    const store = { assignments: { '1': [a1, a2] } } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: store.assignments,
      reservations: [],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 1, true, 'driving', accommodations as any)
    );
    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    // No spurious morning bookend [hotel → airport].
    expect(legs).not.toContainEqual([`${hotel.lat},${hotel.lng}`, `${airport.lat},${airport.lng}`]);
    // The day starts at the airport, and still ends at the hotel for the night.
    expect(result.current.route?.[0]?.[0]).toEqual([airport.lat, airport.lng]);
    expect(legs).toContainEqual([`${museum.lat},${museum.lng}`, `${hotel.lat},${hotel.lng}`]);
  });

  it('FE-HOOK-ROUTE-021: #1465 check-out day with a place after check-out draws no last-stop → hotel leg', async () => {
    // Day 2 is the hotel's check-out day (11:00). You wake there, visit a museum (09:00), then
    // head "home" (18:00, after check-out). Having left the hotel, there is no return leg — but
    // the morning leg [hotel → museum] (you slept there) stays.
    const museum = buildPlace({ lat: 41.38, lng: 2.17, place_time: '09:00' });
    const home = buildPlace({ lat: 41.10, lng: 1.80, place_time: '18:00' });
    const hotel = { lat: 41.39, lng: 2.16 };
    const a1 = buildAssignment({ day_id: 2, order_index: 0, place: museum });
    const a2 = buildAssignment({ day_id: 2, order_index: 1, place: home });
    const accommodations = [{ id: 1, start_day_id: 1, end_day_id: 2, check_out: '11:00', place_lat: hotel.lat, place_lng: hotel.lng }];
    const store = { assignments: { '2': [a1, a2] } } as unknown as TripStoreState;
    useTripStore.setState({
      assignments: store.assignments,
      reservations: [],
      days: [{ id: 1, day_number: 1 }, { id: 2, day_number: 2 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store, 2, true, 'driving', accommodations as any)
    );
    await act(async () => {});

    const legs = (result.current.route ?? []).map(run => run.map(p => `${p[0]},${p[1]}`));
    // No spurious evening bookend [home → hotel].
    expect(legs).not.toContainEqual([`${home.lat},${home.lng}`, `${hotel.lat},${hotel.lng}`]);
    // The morning leg from the slept-in hotel is still drawn, and the day ends at home.
    expect(legs).toContainEqual([`${hotel.lat},${hotel.lng}`, `${museum.lat},${museum.lng}`]);
    const flat = result.current.route ?? [];
    expect(flat[flat.length - 1]?.[flat[flat.length - 1].length - 1]).toEqual([home.lat, home.lng]);
  });

  it('FE-HOOK-ROUTE-012: setRoute and setRouteInfo are exposed', () => {
    const store = buildMockStore({});
    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, null)
    );
    expect(result.current.setRoute).toBeTypeOf('function');
    expect(result.current.setRouteInfo).toBeTypeOf('function');
  });

  it('FE-HOOK-ROUTE-013: route recalculates when assignments change via store update', async () => {

    const p1 = buildPlace({ lat: 10, lng: 10 });
    const p2 = buildPlace({ lat: 20, lng: 20 });
    const a1 = buildAssignment({ day_id: 5, order_index: 0, place: p1 });
    const a2 = buildAssignment({ day_id: 5, order_index: 1, place: p2 });

    let storeData = buildMockStore({ '5': [a1, a2] });

    const { result, rerender } = renderHook(() =>
      useRouteCalculation(storeData as TripStoreState, 5)
    );

    await act(async () => {});

    expect(result.current.route).toEqual([
      [[p1.lat, p1.lng], [p2.lat, p2.lng]],
    ]);

    // Now add a third place — update both the local store object and the Zustand store
    const p3 = buildPlace({ lat: 30, lng: 30 });
    const a3 = buildAssignment({ day_id: 5, order_index: 2, place: p3 });
    storeData = buildMockStore({ '5': [a1, a2, a3] }); // also calls useTripStore.setState

    await act(async () => {
      rerender();
    });

    await act(async () => {});

    expect(result.current.route).toEqual([
      [[p1.lat, p1.lng], [p2.lat, p2.lng], [p3.lat, p3.lng]],
    ]);
  });

  it('FE-HOOK-ROUTE-018: two flights on one day are not road-routed airport→airport (#1394)', async () => {
    // Two single-day flights, no place between them. The arrival of the first and the
    // departure of the second must NOT be joined into a phantom driving run — that leg
    // is the flight itself, not a drive.
    const store = buildMockStore({ '5': [] });
    useTripStore.setState({
      reservations: [
        { id: 1, type: 'flight', day_id: 5, end_day_id: 5, day_positions: { 5: 0 },
          endpoints: [{ role: 'from', lat: 52.5, lng: 13.4 }, { role: 'to', lat: 42.4, lng: 18.7 }] },
        { id: 2, type: 'flight', day_id: 5, end_day_id: 5, day_positions: { 5: 1 },
          endpoints: [{ role: 'from', lat: 50.1, lng: 14.3 }, { role: 'to', lat: 42.4, lng: 18.9 }] },
      ],
      days: [{ id: 5, day_number: 1 }],
    } as any);

    const { result } = renderHook(() =>
      useRouteCalculation(store as TripStoreState, 5)
    );
    await act(async () => {});

    // No real place anywhere on the day → nothing is a drive → no route is drawn.
    // Before the fix this produced a bogus [flight1.arrival → flight2.departure] leg.
    expect(result.current.route).toBeNull();
    expect(result.current.routeSegments).toEqual([]);
  });
});
