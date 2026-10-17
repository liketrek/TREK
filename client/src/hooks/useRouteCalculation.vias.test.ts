import { renderHook, waitFor } from '@testing-library/react';
import type { RoadtripVia } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../tests/helpers/factories';
import { resetAllStores } from '../../tests/helpers/store';
import { useSettingsStore } from '../store/settingsStore';
import { useTripStore } from '../store/tripStore';
import type { Assignment, RouteSegment } from '../types';
import { useRouteCalculation } from './useRouteCalculation';

const mocks = vi.hoisted(() => ({ route: vi.fn(), mirrorServiceStops: true }));
vi.mock('../components/Map/RouteCalculator', async (importActual) => ({
  ...(await importActual<typeof import('../components/Map/RouteCalculator')>()),
  calculateRouteWithLegs: mocks.route,
}));
vi.mock('./useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (settings: { roadtrip_service_stops_in_days: boolean }) => unknown) =>
    select({ roadtrip_service_stops_in_days: mocks.mirrorServiceStops }),
}));

const segment = (distance: number): RouteSegment => ({
  mid: [0, 0],
  from: [0, 0],
  to: [0, 0],
  distance,
  duration: distance / 20,
  distanceText: '',
  durationText: '',
  walkingText: '',
  drivingText: '',
});

const via = (afterOrderIndex: number, lat: number, lng: number, sequence = 0, dayId = 1): RoadtripVia =>
  ({
    id: sequence + afterOrderIndex * 10,
    day_id: dayId,
    after_order_index: afterOrderIndex,
    sequence,
    lat,
    lng,
    created_at: '',
  }) as RoadtripVia;

/** Paris, Brussels; the chosen road bends east of the direct one. */
function seed(extra: Assignment[] = []) {
  const paris = buildAssignment({
    id: 101,
    day_id: 1,
    order_index: 0,
    place: buildPlace({ id: 1, lat: 48.85, lng: 2.29 }),
  });
  const brussels = buildAssignment({
    id: 102,
    day_id: 1,
    order_index: 1,
    place: buildPlace({ id: 2, lat: 50.89, lng: 4.34 }),
  });
  const assignments = { '1': [paris, brussels, ...extra] };
  useTripStore.setState({ days: [buildDay({ id: 1 })], assignments, places: [], reservations: [] });
  return assignments;
}

const askedLats = () => mocks.route.mock.calls.map((call) => call[0].map((point: { lat: number }) => point.lat));

beforeEach(() => {
  resetAllStores();
  mocks.mirrorServiceStops = true;
  mocks.route.mockReset().mockImplementation(async (points: Array<{ lat: number; lng: number }>) => ({
    coordinates: points.map((point) => [point.lat, point.lng]),
    legs: points.slice(1).map((_, i) => segment(100_000 + i * 10_000)),
  }));
  useSettingsStore.setState((state) => ({
    settings: { ...state.settings, optimize_from_accommodation: false, distance_unit: 'metric' },
  }));
});

describe('useRouteCalculation with the road trip vias (#2580)', () => {
  it('FE-HOOK-ROUTE-VIA-001: routes the day through the road chosen in the road trip', async () => {
    const assignments = seed();
    const vias = { 1: [via(0, 49.85, 3.29)] };
    const { result } = renderHook(() => useRouteCalculation({ assignments, roadtripVias: vias }, 1, true, 'driving'));

    await waitFor(() => expect(result.current.routeSegments).toHaveLength(1));
    expect(askedLats()).toEqual([[48.85, 49.85, 50.89]]);
    // One connector per stop pair, carrying the whole bent drive.
    expect(result.current.routeSegments[0].distance).toBe(210_000);
    expect(result.current.routeSegments[0].distanceText).toBe('210 km');
    expect(result.current.route).toEqual([
      [
        [48.85, 2.29],
        [49.85, 3.29],
        [50.89, 4.34],
      ],
    ]);
  });

  it('FE-HOOK-ROUTE-VIA-002: several vias on one leg keep their sequence', async () => {
    const assignments = seed();
    const vias = { 1: [via(0, 50.2, 3.9, 1), via(0, 49.5, 3.0, 0)] };
    renderHook(() => useRouteCalculation({ assignments, roadtripVias: vias }, 1, true, 'driving'));

    await waitFor(() => expect(mocks.route).toHaveBeenCalled());
    expect(askedLats()).toEqual([[48.85, 49.5, 50.2, 50.89]]);
  });

  it('FE-HOOK-ROUTE-VIA-003: without vias the day routes exactly as before', async () => {
    const assignments = seed();
    const { result } = renderHook(() => useRouteCalculation({ assignments }, 1, true, 'driving'));

    await waitFor(() => expect(result.current.routeSegments).toHaveLength(1));
    expect(askedLats()).toEqual([[48.85, 50.89]]);
    expect(result.current.routeSegments[0].distance).toBe(100_000);
  });

  it('FE-HOOK-ROUTE-VIA-004: a hidden service stop between two stops keeps the vias off the shortcut', async () => {
    mocks.mirrorServiceStops = false;
    // Stored order: Paris (0), fuel stop (1), Brussels (2). The via leaves Paris towards
    // the fuel stop, a leg the day list does not draw.
    const fuel = buildAssignment({
      id: 103,
      day_id: 1,
      order_index: 0.5,
      place: buildPlace({ id: 3, lat: 49.4, lng: 2.8, stop_type: 'fuel' }),
    });
    const assignments = seed([fuel]);
    const vias = { 1: [via(0, 49.1, 2.5)] };
    renderHook(() => useRouteCalculation({ assignments, roadtripVias: vias }, 1, true, 'driving'));

    await waitFor(() => expect(mocks.route).toHaveBeenCalled());
    expect(askedLats()).toEqual([[48.85, 50.89]]);
  });

  it('FE-HOOK-ROUTE-VIA-005: a lodging row the day list hides still counts in the anchor index', async () => {
    // Stored order: hotel row (0), Paris (1), Brussels (2). The via behind Paris is filed
    // at 1, because the road trip counts the hotel row the day list leaves out.
    const hotel = buildAssignment({
      id: 104,
      day_id: 1,
      order_index: -1,
      accommodation_id: 9,
      place: buildPlace({ id: 4, lat: 48.8, lng: 2.3 }),
    });
    const assignments = seed([hotel]);
    const vias = { 1: [via(1, 49.85, 3.29)] };
    renderHook(() => useRouteCalculation({ assignments, roadtripVias: vias }, 1, true, 'driving'));

    await waitFor(() => expect(mocks.route).toHaveBeenCalled());
    expect(askedLats()).toEqual([[48.85, 49.85, 50.89]]);
  });

  it('FE-HOOK-ROUTE-VIA-006: a new choice redraws the day', async () => {
    const assignments = seed();
    let vias: Record<number, RoadtripVia[]> = {};
    const { rerender } = renderHook(() => useRouteCalculation({ assignments, roadtripVias: vias }, 1, true, 'driving'));
    await waitFor(() => expect(mocks.route).toHaveBeenCalledTimes(1));

    vias = { 1: [via(0, 49.85, 3.29)] };
    rerender();

    await waitFor(() => expect(mocks.route).toHaveBeenCalledTimes(2));
    expect(askedLats()[1]).toEqual([48.85, 49.85, 50.89]);
  });
});
