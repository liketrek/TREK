import { act, renderHook } from '@testing-library/react';
import type { TourCreateRequest, TourCreateResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, routeCityWalk, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(
  () => ({
    routeWalkingTour: vi.fn(),
    routeCityWalk: vi.fn(),
    enrichTourElevations: vi.fn(),
    createTour: vi.fn(),
    detailTour: vi.fn(),
    updateTour: vi.fn(),
  })
);

vi.mock('./tourRouting', () => ({ routeWalkingTour, routeCityWalk, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({ useTourPermissions: () => ({ canEdit: true, canAssign: true }) }));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import type { DerivedTourDraft } from './tourPlannerDraft';
import type { TourRouteResult, WalkFerryCrossing } from './tourRouting';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-WALK-FERRY-001 to FE-TOUR-WALK-FERRY-003: a city walk the router can only join by boat (CW-12).

const SAN_MARCO: [number, number] = [45.4342798, 12.338111];
const ZATTERE: [number, number] = [45.4296, 12.3264];
const REDENTORE: [number, number] = [45.4268, 12.33];
const boatLine: [number, number][] = [ZATTERE, [45.4291, 12.3266], [45.4275, 12.3282], REDENTORE];

const crossing = (accepted: boolean): WalkFerryCrossing => ({
  leg: 1,
  geometry: boatLine,
  crossings: [[1, 2]],
  metres: 268,
  seconds: 396,
  walkSeconds: 120,
  accepted,
});

const routedWith = (ferry: WalkFerryCrossing | null): TourRouteResult => ({
  coordinates: [SAN_MARCO, ZATTERE, ...boatLine.slice(1)],
  parts: [
    { coordinates: [SAN_MARCO, ZATTERE, boatLine[1]], free: false },
    { coordinates: boatLine.slice(1, 3), free: false, mark: 'ferry' },
    { coordinates: boatLine.slice(2), free: false },
  ],
  distanceMeters: 1900,
  durationSeconds: 1020,
  ...(ferry ? { ferries: [ferry] } : {}),
});

const heights = (line: [number, number][]) => line.map(([lat, lng]) => [lat, lng, 2] as [number, number, number]);

const answered = (body: TourCreateRequest): TourCreateResponse => ({
  tour: {
    place_id: 61,
    name: body.name,
    tour_type: 'walk',
    distance: 1.9,
    elevation_gain: 0,
    elevation_loss: 0,
    duration: 17,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    revision: 1,
  },
  waypoints: body.waypoints.map((point, index) => ({ ...point, key: point.key ?? `stop-${index}` })),
});

const TO_GIUDECCA: DerivedTourDraft = {
  name: 'Venice to the Redentore',
  difficulty: 2,
  points: [
    { lat: SAN_MARCO[0], lng: SAN_MARCO[1], name: 'Piazza San Marco' },
    { lat: ZATTERE[0], lng: ZATTERE[1], name: 'Zattere' },
    { lat: REDENTORE[0], lng: REDENTORE[1], name: 'Il Redentore' },
  ],
  inPlace: false,
  tourType: 'walk',
};

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

describe('useTourPlanner, a city walk across the water (CW-12)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset();
    routeCityWalk.mockReset().mockResolvedValue(routedWith(crossing(false)));
    enrichTourElevations.mockReset().mockImplementation(async (line: [number, number][]) => heights(line));
    createTour.mockReset().mockImplementation(async (_trip: number, body: TourCreateRequest) => answered(body));
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-WALK-FERRY-001: a crossing the router took holds the save until it is taken as a ferry leg', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 41 }));
    act(() => {
      result.current.startDerivedTour(TO_GIUDECCA);
    });
    await settle();
    expect(result.current.status).toBe('ready');
    expect(result.current.walkFerries.pending).toHaveLength(1);
    expect(result.current.canSave).toBe(false);

    routeCityWalk.mockResolvedValue(routedWith(crossing(true)));
    act(() => result.current.walkFerries.accept(result.current.walkFerries.pending[0] as WalkFerryCrossing));
    expect(result.current.waypoints[1]?.fixedLeg).toEqual({
      kind: 'ferry',
      geometry: boatLine,
      crossings: [[1, 2]],
      minutes: 7,
      walk_minutes: 2,
    });
    await settle();
    expect(result.current.walkFerries.pending).toHaveLength(0);
    expect(result.current.canSave).toBe(true);

    await act(async () => {
      await result.current.save();
    });
    const body = createTour.mock.calls[0]?.[1] as TourCreateRequest;
    expect(body.waypoints[1]?.fixed_leg).toMatchObject({ kind: 'ferry', crossings: [[1, 2]], minutes: 7 });
    // The walking time saved is the walk alone; the boat's minutes stay on the leg.
    expect(body.duration_seconds).toBe(17 * 60);
  });

  it('FE-TOUR-WALK-FERRY-002: a ferry leg given back is planned on foot again, as one step of the history', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 42 }));
    act(() => {
      result.current.startDerivedTour(TO_GIUDECCA);
    });
    await settle();
    act(() => result.current.walkFerries.accept(result.current.walkFerries.pending[0] as WalkFerryCrossing));
    const id = result.current.waypoints[1]?.id as string;
    act(() => result.current.walkFerries.release(id));
    expect(result.current.waypoints[1]?.fixedLeg).toBeUndefined();
    act(() => result.current.undo());
    expect(result.current.waypoints[1]?.fixedLeg?.kind).toBe('ferry');
  });

  it('FE-TOUR-WALK-FERRY-003: stops no way joins keep the route planned before, no longer current, and name the leg', async () => {
    routeCityWalk.mockResolvedValue(routedWith(null));
    const { result } = renderHook(() => useTourPlanner({ tripId: 43 }));
    act(() => {
      result.current.startDerivedTour(TO_GIUDECCA);
    });
    await settle();
    const before = result.current.route;
    expect(result.current.canSave).toBe(true);

    routeCityWalk.mockResolvedValue({ gap: 1 });
    act(() => {
      result.current.setWaypointPosition(result.current.waypoints[2]?.id as string, 45.41, 12.35);
    });
    await settle();
    expect(result.current.status).toBe('routing-failed');
    expect(result.current.error).toBe('walk-gap');
    expect(result.current.walkFerries.gap).toEqual({ leg: 1 });
    expect(result.current.route).toBe(before);
    expect(result.current.routeCurrent).toBe(false);
    expect(result.current.canSave).toBe(false);
  });
});
