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
import { validDraft } from './tourPlannerDraft';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-WALK-IMPORT-PLANNER-001 to FE-TOUR-WALK-IMPORT-PLANNER-004: a walk read from a Google Maps link,
// opened as a new draft with its stop names, routed on foot by TREK and saved like any other walk (CW-07).

const routed = {
  coordinates: [
    [41.1425899, -8.6092477],
    [41.1382776, -8.6117899],
  ] as [number, number][],
  parts: [
    {
      coordinates: [
        [41.1425899, -8.6092477],
        [41.1382776, -8.6117899],
      ] as [number, number][],
      free: false,
    },
  ],
  distanceMeters: 1400,
  durationSeconds: 1200,
};
const enriched = [
  [41.1425899, -8.6092477, 80],
  [41.1382776, -8.6117899, 10],
] as [number, number, number][];

const answered = (body: TourCreateRequest): TourCreateResponse => ({
  tour: {
    place_id: 51,
    name: body.name,
    tour_type: 'walk',
    distance: 1.4,
    elevation_gain: 5,
    elevation_loss: 75,
    duration: 20,
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

/** What the walk import hands the planner for a route of three stops, the middle one given as coordinates. */
const FROM_GOOGLE: DerivedTourDraft = {
  name: 'Walk from Google Maps',
  difficulty: 2,
  points: [
    { lat: 41.1425899, lng: -8.6092477, name: 'Igreja de Santa Clara' },
    { lat: 41.1428531, lng: -8.6111165, name: null },
    { lat: 41.1382776, lng: -8.6117899, name: 'Ribeira de Gaia' },
  ],
  inPlace: false,
  tourType: 'walk',
  source: 'google_maps',
};

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

const storedDraft = (tripId: number) => JSON.parse(draftStore.getItem(`tour-draft-${tripId}`) ?? 'null') as unknown;

describe('useTourPlanner, a walk read from Google Maps (CW-07)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    routeCityWalk.mockReset().mockResolvedValue(routed);
    enrichTourElevations.mockReset().mockResolvedValue(enriched);
    createTour.mockReset().mockImplementation(async (_trip: number, body: TourCreateRequest) => answered(body));
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-WALK-IMPORT-PLANNER-001: opens as a new walk with its stop names, routed on foot by TREK', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 31 }));
    let started = false;
    act(() => {
      started = result.current.startDerivedTour(FROM_GOOGLE);
    });
    expect(started).toBe(true);
    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(result.current.tourType).toBe('walk');
    expect(result.current.name).toBe('Walk from Google Maps');
    expect(result.current.draftSource).toBe('google_maps');
    expect(result.current.derivedFromPlaceId).toBeNull();
    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.waypoints.map((point) => [point.name, point.role])).toEqual([
      ['Igreja de Santa Clara', 'start'],
      [undefined, 'via'],
      ['Ribeira de Gaia', 'end'],
    ]);
    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
    expect(routeWalkingTour).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
  });

  it('FE-TOUR-WALK-IMPORT-PLANNER-002: saves as a walk with the stop names and no import it was derived from', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 31 }));
    act(() => {
      result.current.startDerivedTour(FROM_GOOGLE);
    });
    await settle();
    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    const body = createTour.mock.calls[0]?.[1] as TourCreateRequest;
    expect(body.tour_type).toBe('walk');
    expect(body.waypoints.map((point) => point.name ?? null)).toEqual([
      'Igreja de Santa Clara',
      null,
      'Ribeira de Gaia',
    ]);
    expect(body).not.toHaveProperty('derived_from_place_id');
    // Saved, the walk is TREK's own: the notice of where it came from goes.
    expect(result.current.draftSource).toBeNull();
    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: 51 });
  });

  it('FE-TOUR-WALK-IMPORT-PLANNER-003: the source is kept with the unsaved draft across a reload, and forgotten when it is thrown away', async () => {
    const first = renderHook(() => useTourPlanner({ tripId: 32 }));
    act(() => {
      first.result.current.startDerivedTour(FROM_GOOGLE);
    });
    expect(storedDraft(32)).toMatchObject({ draftSource: 'google_maps', tourType: 'walk' });
    first.unmount();

    const reloaded = renderHook(() => useTourPlanner({ tripId: 32 }));
    await act(async () => {});
    expect(reloaded.result.current.draftSource).toBe('google_maps');
    expect(reloaded.result.current.waypoints[0]?.name).toBe('Igreja de Santa Clara');
    act(() => reloaded.result.current.returnToNeutral());
    expect(reloaded.result.current.draftSource).toBeNull();
    expect(storedDraft(32)).toBeNull();
  });

  it('FE-TOUR-WALK-IMPORT-PLANNER-004: a stored draft names no source, or Google Maps; any other is not taken back', () => {
    const draft = { version: 10, name: 'Walk', waypoints: [] };
    expect(validDraft(draft)).toBe(true);
    expect(validDraft({ ...draft, draftSource: null })).toBe(true);
    expect(validDraft({ ...draft, draftSource: 'google_maps' })).toBe(true);
    expect(validDraft({ ...draft, draftSource: 'komoot' })).toBe(false);
  });
});
