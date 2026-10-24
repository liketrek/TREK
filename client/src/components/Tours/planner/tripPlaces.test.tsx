import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { withPointAppended } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCategory, buildPlace } from '../../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useTripStore } from '../../../store/tripStore';
import {
  plannerWaypointsOf,
  sameWaypointSnapshot,
  savedWaypointsOf,
  unlinkedPoint,
  type TourPlannerWaypoint,
} from './tourPlannerWaypoints';
import { TripPlacePicker } from './TripPlacePicker';
import type { TourPlannerController } from './useTourPlanner';
import { useTripPlaceWaypoints } from './useTripPlaceWaypoints';

const hut = buildPlace({ id: 11, name: 'Höllentalangerhütte', lat: 47.425, lng: 11.03, category_id: 3 });
const lake = buildPlace({ id: 12, name: 'Eibsee', lat: 47.457, lng: 10.97, category_id: null });
const unplaced = buildPlace({ id: 13, name: 'Somewhere', lat: null, lng: null });
const tour = buildPlace({ id: 14, name: 'Another tour', lat: 47.42, lng: 11.02 });

const start: TourPlannerWaypoint = { id: 'a', lat: 47.42, lng: 11.02, role: 'start' };
const end: TourPlannerWaypoint = { id: 'b', lat: 47.43, lng: 11.04, role: 'end' };

function plannerWith(points: TourPlannerWaypoint[]) {
  let current = points;
  const planner = {
    waypoints: points,
    route: null,
    editWaypoints: vi.fn((change: (list: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
      current = change(current);
    }),
    setSelectedWaypointId: vi.fn(),
  } as unknown as TourPlannerController;
  return { planner, points: () => current };
}

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { places: [hut, lake, unplaced, tour], categories: [buildCategory({ id: 3, name: 'Hut' })] });
});

describe('waypoints that stand for a place (PR1-10)', () => {
  it('carry the place through saving and opening, and lose it once moved', () => {
    const linked = { ...end, linkedPlaceId: 11 };
    const saved = savedWaypointsOf([start, linked]);
    expect(saved[1]).toMatchObject({ linked_place_id: 11 });
    expect(saved[0]).not.toHaveProperty('linked_place_id');
    expect(plannerWaypointsOf(saved, () => 'x')[1]).toMatchObject({ linkedPlaceId: 11 });
    expect(unlinkedPoint(linked)).not.toHaveProperty('linkedPlaceId');
    expect(unlinkedPoint(start)).toBe(start);
    // Linking or unlinking alone is a change of the tour.
    expect(sameWaypointSnapshot([start, end], [start, linked])).toBe(false);
  });

  it('a new point goes at the end, or before the way back of a loop', () => {
    const point = { id: 'c', lat: 1, lng: 1, role: 'end' as const };
    expect(withPointAppended([start, end], point).map((p) => [p.id, p.role])).toEqual([
      ['a', 'start'],
      ['b', 'end'],
      ['c', 'end'],
    ]);
    const loop = [start, end, { ...start, id: 'back', role: 'end' as const }];
    expect(withPointAppended(loop, point).map((p) => p.id)).toEqual(['a', 'b', 'c', 'back']);
  });
});

describe('useTripPlaceWaypoints (PR1-10)', () => {
  it('offers places with a spot and no tour, nearest to the tour first, and knows the ones in use', () => {
    const { planner } = plannerWith([start, { ...end, linkedPlaceId: 12 }]);
    const { result } = renderHook(() => useTripPlaceWaypoints(planner, new Set([14])));
    expect(result.current.candidates.map((c) => c.place.id)).toEqual([11, 12]);
    expect(result.current.candidates[0]).toMatchObject({ used: false, category: { name: 'Hut' } });
    expect(result.current.candidates[0].distanceM).toBeLessThan(1_000);
    expect(result.current.candidates[1].used).toBe(true);
    expect(result.current.linkedPlaceOf({ linkedPlaceId: 12 })?.name).toBe('Eibsee');
    expect(result.current.linkedPlaceOf({ linkedPlaceId: 99 })).toBeNull();
    expect(result.current.linkedPlaceOf({})).toBeNull();
  });

  it('adds a stop on the place, as one step, and unlinks it without touching the place', () => {
    const { planner, points } = plannerWith([start, end]);
    const { result } = renderHook(() => useTripPlaceWaypoints(planner, new Set()));
    act(() => result.current.add(hut));
    expect(points()[2]).toMatchObject({ lat: 47.425, lng: 11.03, linkedPlaceId: 11, role: 'end' });
    expect(planner.setSelectedWaypointId).toHaveBeenCalledWith(points()[2].id);
    act(() => result.current.unlink(points()[2].id));
    expect(points()[2]).not.toHaveProperty('linkedPlaceId');
    expect(useTripStore.getState().places).toContain(hut);
    act(() => result.current.add(unplaced));
    expect(points()).toHaveLength(3);
  });

  it('measures from the points while the tour has no route, and from nothing while it has none', () => {
    const empty = plannerWith([]);
    const { result } = renderHook(() => useTripPlaceWaypoints(empty.planner, new Set()));
    expect(result.current.candidates.every((c) => c.distanceM === null)).toBe(true);
    const single = plannerWith([start]);
    const one = renderHook(() => useTripPlaceWaypoints(single.planner, new Set()));
    expect(one.result.current.candidates[0].distanceM).not.toBeNull();
  });
});

describe('TripPlacePicker (PR1-10)', () => {
  function renderPicker(points: TourPlannerWaypoint[]) {
    const { planner } = plannerWith(points);
    const picker = renderHook(() => useTripPlaceWaypoints(planner, new Set([14]))).result.current;
    const onClose = vi.fn();
    render(<TripPlacePicker picker={{ ...picker, add: vi.fn() }} onClose={onClose} />);
    return { onClose };
  }

  it('groups the places near the tour apart, searches them, and closes on Escape', () => {
    const { onClose } = renderPicker([start, end]);
    expect(screen.getByText('tours.placePicker.near')).toBeInTheDocument();
    expect(screen.getAllByTestId('trip-place-candidate')).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText('tours.placePicker.search'), { target: { value: 'eib' } });
    expect(screen.getAllByTestId('trip-place-candidate')).toHaveLength(1);
    fireEvent.change(screen.getByPlaceholderText('tours.placePicker.search'), { target: { value: 'zzz' } });
    expect(screen.getByText('tours.placePicker.noMatch')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByTestId('trip-place-picker'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('says so when the trip has no place to offer', () => {
    seedStore(useTripStore, { places: [unplaced] });
    renderPicker([]);
    expect(screen.getByText('tours.placePicker.empty')).toBeInTheDocument();
  });
});
