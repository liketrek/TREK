import { act, renderHook } from '@testing-library/react';
import type { HorseRoute } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, routeBikeTour, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(
  () => ({
    routeWalkingTour: vi.fn(),
    routeBikeTour: vi.fn(),
    enrichTourElevations: vi.fn(),
    createTour: vi.fn(),
    detailTour: vi.fn(),
    updateTour: vi.fn(),
  })
);

// The ride is put together by the real rideTour; only a router asked by mistake and the heights are stand-ins.
vi.mock('./tourRouting', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tourRouting')>()),
  routeWalkingTour,
  routeBikeTour,
  enrichTourElevations,
}));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({ useTourPermissions: () => ({ canEdit: true, canAssign: true }) }));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import { sectionLeg, withSectionAppended } from '../horse/horseSection';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-HORSE-001 to FE-TOUR-HORSE-005

const route: HorseRoute = {
  id: 'relation/42',
  name: 'Reitweg Isartal',
  ref: 'R1',
  osmUrl: 'https://www.openstreetmap.org/relation/42',
  continues: false,
  sections: [
    {
      number: 1,
      geometry: [
        [48, 11],
        [48.005, 11.005],
        [48.01, 11.01],
      ],
      length_m: 1360,
      access: [{ value: 'designated', length_m: 1360 }],
      signposted: 'with',
    },
  ],
};
const section = sectionLeg(route, route.sections[0], false);
const heights = (line: [number, number][]) =>
  line.map(([lat, lng], index): [number, number, number] => [lat, lng, 500 + index]);

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

function rideWithSection(tripId: number) {
  const hook = renderHook(() => useTourPlanner({ tripId }));
  let next = 0;
  const newId = () => `section-point-${(next += 1)}`;
  act(() => hook.result.current.setTourType('horse'));
  act(() => hook.result.current.editWaypoints((points) => withSectionAppended(points, section, newId)));
  return hook;
}

describe('useTourPlanner, rides on horseback (HOR-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset();
    routeBikeTour.mockReset();
    enrichTourElevations.mockReset().mockImplementation(async (line: [number, number][]) => heights(line));
    createTour.mockReset();
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-HORSE-001: a ride is its sections and manual legs as drawn, with heights and no riding time', async () => {
    const { result } = rideWithSection(61);
    act(() => result.current.addWaypoint(48.02, 11.02));
    expect(result.current.isHorse).toBe(true);
    expect(result.current.waypoints.map((point) => point.fixedLeg?.kind ?? null)).toEqual([
      'horse_route',
      'free',
      null,
    ]);
    await settle();
    expect(routeWalkingTour).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
    expect(result.current.routeParts?.map((part) => part.free)).toEqual([false, true]);
    expect(result.current.route?.[0]).toEqual([48, 11]);
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.walkingDurationMinutes).toBeNull();
    expect(result.current.plannedTotalMinutes).toBeNull();
  });

  it('FE-TOUR-HORSE-002: saves the ride with the origin of each leg and no riding time worked out', async () => {
    createTour.mockResolvedValue({ tour: { place_id: 9, tour_type: 'horse', revision: 1 }, waypoints: [] });
    const { result } = rideWithSection(62);
    act(() => result.current.addWaypoint(48.02, 11.02));
    act(() => result.current.setName('Isar ride'));
    await settle();
    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    const body = createTour.mock.calls[0]?.[1];
    expect(body).toMatchObject({
      tour_type: 'horse',
      duration_seconds: null,
      max_hiking_difficulty: null,
      bike_profile: null,
    });
    expect(body.waypoints.map((point: { fixed_leg?: { kind: string } }) => point.fixed_leg?.kind ?? null)).toEqual([
      'horse_route',
      'free',
      null,
    ]);
    expect(body.waypoints[0].fixed_leg).toMatchObject({ ref: 'relation/42', signposted: 'with' });
  });

  it('FE-TOUR-HORSE-003: a routed leg turns manual on a ride, a section goes back to the router on a hike', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 63 }));
    act(() => {
      result.current.addWaypoint(47.99, 10.99);
      result.current.addWaypoint(48, 11);
    });
    expect(result.current.waypoints[0].fixedLeg).toBeUndefined();
    act(() => result.current.setTourType('horse'));
    expect(result.current.waypoints[0].fixedLeg?.kind).toBe('free');
    // The hike ended where the section starts: the section goes on from that point.
    act(() => result.current.editWaypoints((points) => withSectionAppended(points, section, () => 'section-end')));
    expect(result.current.waypoints.map((point) => point.fixedLeg?.kind ?? null)).toEqual([
      'free',
      'horse_route',
      null,
    ]);
    act(() => result.current.setTourType('hike'));
    expect(result.current.waypoints[1].fixedLeg ?? null).toBeNull();
    act(() => result.current.undo());
    expect(result.current.waypoints[1].fixedLeg?.kind).toBe('horse_route');
  });

  it('FE-TOUR-HORSE-004: a point at a section stays put, one between manual legs moves', () => {
    const { result } = rideWithSection(64);
    act(() => result.current.addWaypoint(48.02, 11.02));
    const [start, end, last] = result.current.waypoints;
    let moved = true;
    act(() => {
      moved = result.current.setWaypointPosition(end.id, 48.011, 11.011);
    });
    expect(moved).toBe(false);
    expect(result.current.waypoints[1]).toMatchObject({ lat: 48.01, lng: 11.01 });
    expect(result.current.setWaypointPosition(start.id, 47.9, 11)).toBe(false);
    act(() => {
      moved = result.current.setWaypointPosition(last.id, 48.03, 11.03);
    });
    expect(moved).toBe(true);
    expect(result.current.waypoints[1].fixedLeg?.geometry).toEqual([
      [48.01, 11.01],
      [48.03, 11.03],
    ]);
  });

  it('FE-TOUR-HORSE-005: turning the ride round turns its section and its signposting round with it', () => {
    const { result } = rideWithSection(65);
    act(() => result.current.reverse());
    const leg = result.current.waypoints[0].fixedLeg;
    expect(leg?.kind).toBe('horse_route');
    expect(leg?.geometry[0]).toEqual([48.01, 11.01]);
    expect(leg?.kind === 'horse_route' ? leg.signposted : null).toBe('against');
  });
});
