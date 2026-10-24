import { renderHook, waitFor } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildPlace, buildReservation } from '../../../tests/helpers/factories';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { tourRepo } from '../../repo/tourRepo';
import type { RouteSegment } from '../../types';
import type { MergedItem } from '../../utils/dayMerge';
import { useTransitLegPlanner, type TransitLegPlannerDeps } from './useTransitLegPlanner';

// CW-08: the transit leg behind the desktop day plan and the phone timeline.

vi.mock('../../repo/tourRepo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../repo/tourRepo')>();
  return { ...actual, tourRepo: { ...actual.tourRepo, detail: vi.fn() } };
});

const oldTown = buildPlace({
  id: 51,
  name: 'Old town',
  lat: 52.52,
  lng: 13.4,
  route_geometry: '[[52.52,13.4],[52.515,13.41],[52.51,13.42]]',
});
const harbour = buildPlace({
  id: 52,
  name: 'Harbour',
  lat: 52.5,
  lng: 13.45,
  route_geometry: '[[52.5,13.45],[52.49,13.46]]',
});
const museum = buildPlace({ id: 53, name: 'Museum', lat: 52.47, lng: 13.48, place_time: '9:05' });
const cafe = buildPlace({ id: 54, name: 'Corner cafe', lat: 52.48, lng: 13.47 });

const walkA = buildAssignment({
  id: 201,
  day_id: 10,
  order_index: 0,
  tour_place_id: 51,
  place: { ...oldTown, place_time: '10:00' },
});
const walkB = buildAssignment({
  id: 202,
  day_id: 10,
  order_index: 1,
  tour_place_id: 52,
  place: { ...harbour, place_time: '13:00' },
});
const assignments = {
  '10': [walkB, walkA],
  '11': [
    buildAssignment({ id: 301, day_id: 11, order_index: 0, place: museum }),
    buildAssignment({ id: 302, day_id: 11, order_index: 1, place: cafe }),
  ],
};

function walk(place: { id: number; name: string }): TourListItem {
  return {
    place_id: place.id,
    name: place.name,
    tour_type: 'walk',
    duration: 90,
    planned_duration_minutes: null,
    break_additional_minutes: null,
    station_count: 2,
    station_stay_minutes: 45,
    station_stays_unknown: 0,
  } as TourListItem;
}
const tours = new Map([walk(oldTown), walk(harbour)].map((tour) => [tour.place_id, tour]));

const BETWEEN_WALKS = { from: [52.51, 13.42], to: [52.5, 13.45] } as unknown as RouteSegment;
const MUSEUM_TO_CAFE = { from: [52.47, 13.48], to: [52.48, 13.47] } as unknown as RouteSegment;

function setup(overrides: Partial<TransitLegPlannerDeps> = {}) {
  const onPlan = vi.fn();
  const deps: TransitLegPlannerDeps = {
    tripId: 1,
    assignments,
    accommodations: [],
    reservations: [],
    places: [oldTown, harbour, museum, cafe],
    toursEnabled: true,
    tourOf: (placeId) => tours.get(placeId),
    onPlan,
    ...overrides,
  };
  const { result, unmount } = renderHook(() => useTransitLegPlanner(deps), { wrapper: TranslationProvider });
  return { onPlan, result, unmount };
}

const detail = (placeId: number, names: [string, string]) => ({
  tour: tours.get(placeId),
  waypoints: names.map((name, sequence) => ({
    lat: 0,
    lng: 0,
    role: 'via',
    sequence,
    key: `${placeId}-${sequence}`,
    name,
  })),
});

/** Walk reads that answer only once let go, and what each was asked with. */
function heldReads() {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.mocked(tourRepo.detail).mockImplementation((_tripId, placeId) =>
    gate.then(() => detail(placeId, ['First', 'Last']) as never)
  );
  const signals = () => vi.mocked(tourRepo.detail).mock.calls.map((call) => call[2]?.aborted);
  // A turn of the event loop lets every read and what follows it settle.
  const settle = async () => {
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { signals, settle };
}

beforeEach(() => {
  vi.mocked(tourRepo.detail).mockReset();
});

describe('useTransitLegPlanner', () => {
  it('offers no leg without a way to open the search, and the leg as for any connector with one', () => {
    expect(setup({ onPlan: undefined }).result.current.legFor(11, MUSEUM_TO_CAFE)).toBeNull();
    expect(setup().result.current.legFor(11, MUSEUM_TO_CAFE)).toEqual({
      from: { name: 'Museum', lat: 52.47, lng: 13.48 },
      to: { name: 'Corner cafe', lat: 52.48, lng: 13.47 },
      time: '09:05',
    });
  });

  it('opens the search for an ordinary leg at once, with nothing said of walks', () => {
    const { onPlan, result } = setup();
    const leg = result.current.legFor(11, MUSEUM_TO_CAFE);
    if (!leg) throw new Error('no leg');
    result.current.plan(11, leg, 301);
    expect(onPlan.mock.calls[0]?.[0]).toStrictEqual({ dayId: 11, ...leg });
    expect(tourRepo.detail).not.toHaveBeenCalled();
  });

  it('between two walks, opens it from the last stop to the first once both are read, when the first one ends', async () => {
    vi.mocked(tourRepo.detail).mockImplementation((_tripId, placeId) =>
      Promise.resolve(
        detail(placeId, placeId === 51 ? ['Town hall', 'Old bridge'] : ['Fish market', 'Lighthouse']) as never
      )
    );
    const { onPlan, result } = setup();
    const leg = result.current.legFor(10, BETWEEN_WALKS);
    if (!leg) throw new Error('no leg');
    result.current.plan(10, leg, walkA.id);

    expect(onPlan).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(onPlan).toHaveBeenCalledWith({
        dayId: 10,
        from: { name: 'Old bridge', lat: 52.51, lng: 13.42 },
        to: { name: 'Fish market', lat: 52.5, lng: 13.45 },
        time: '12:15',
        walk: {
          dayId: 10,
          fromWalk: 'Old town',
          toWalk: 'Harbour',
          ends: '12:15',
          endsNextDay: false,
          endsAtLeast: false,
          nextStarts: '13:00',
        },
      })
    );
    expect(vi.mocked(tourRepo.detail).mock.calls.map((call) => call[1])).toEqual([51, 52]);
  });

  it('still opens it where a walk cannot be read, naming that end after its walk', async () => {
    vi.mocked(tourRepo.detail).mockImplementation((_tripId, placeId) =>
      placeId === 51
        ? Promise.reject(new Error('Tour not available offline'))
        : // Route ends without keys stand in for stops this device does not hold.
          Promise.resolve({
            tour: tours.get(52),
            waypoints: [{ lat: 52.5, lng: 13.45, role: 'start', sequence: 0 }],
          } as never)
    );
    const { onPlan, result } = setup();
    const leg = result.current.legFor(10, BETWEEN_WALKS);
    if (!leg) throw new Error('no leg');
    result.current.plan(10, leg, walkA.id);

    await waitFor(() => expect(onPlan).toHaveBeenCalledTimes(1));
    expect(onPlan.mock.calls[0]?.[0]).toMatchObject({
      from: { name: 'End of Old town' },
      to: { name: 'Start of Harbour' },
      time: '12:15',
    });
  });

  it('with tours off, treats the leg between two walks as any other', () => {
    const { onPlan, result } = setup({ toursEnabled: false });
    const leg = result.current.legFor(10, BETWEEN_WALKS);
    if (!leg) throw new Error('no leg');
    result.current.plan(10, leg, walkA.id);
    expect(onPlan).toHaveBeenCalledWith({ dayId: 10, ...leg });
    expect(tourRepo.detail).not.toHaveBeenCalled();
  });

  it('opens nothing without a way to open the search', () => {
    const { result } = setup({ onPlan: undefined });
    const leg = { from: { name: '', lat: 52.51, lng: 13.42 }, to: { name: '', lat: 52.5, lng: 13.45 }, time: null };
    expect(() => result.current.plan(10, leg, walkA.id)).not.toThrow();
    expect(tourRepo.detail).not.toHaveBeenCalled();
  });

  it('opens only the leg asked for last, and drops the walks still being read for an earlier one', async () => {
    const reads = heldReads();
    const { onPlan, result } = setup();
    const between = result.current.legFor(10, BETWEEN_WALKS);
    const ordinary = result.current.legFor(11, MUSEUM_TO_CAFE);
    if (!between || !ordinary) throw new Error('no leg');

    result.current.plan(10, between, walkA.id);
    result.current.plan(10, between, walkA.id);
    result.current.plan(11, ordinary, 301);
    expect(reads.signals()).toEqual([true, true, true, true]);
    await reads.settle();

    expect(onPlan).toHaveBeenCalledTimes(1);
    expect(onPlan).toHaveBeenCalledWith({ dayId: 11, ...ordinary });
  });

  it('opens nothing once the view is gone before the walks are read', async () => {
    const reads = heldReads();
    const { onPlan, result, unmount } = setup();
    const leg = result.current.legFor(10, BETWEEN_WALKS);
    if (!leg) throw new Error('no leg');

    result.current.plan(10, leg, walkA.id);
    expect(reads.signals()).toEqual([false, false]);
    unmount();
    expect(reads.signals()).toEqual([true, true]);
    await reads.settle();

    expect(onPlan).not.toHaveBeenCalled();
  });

  it('says when a saved journey now arrives after the walk it leads to starts, while tours are on', () => {
    const journey = buildReservation({ id: 300, type: 'transit', reservation_end_time: '2025-06-01T13:10' });
    const following = [{ type: 'place', sortKey: 1, data: walkB }] as MergedItem[];
    const day = { date: '2025-06-01' };
    expect(setup().result.current.lateBefore(day, journey, following)).toEqual({ walk: 'Harbour', time: '13:00' });
    expect(setup({ toursEnabled: false }).result.current.lateBefore(day, journey, following)).toBeNull();
  });
});
