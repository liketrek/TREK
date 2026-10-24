import { act, renderHook } from '@testing-library/react';
import type { PlannableTourType, TourFixedLeg } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import {
  useWaypointCommands,
  withFixedLegInserted,
  withPointMoved,
  withPointReordered,
  withPointSwapped,
} from './useWaypointCommands';

const point = (id: string, lat = 0, lng = 0, extra: Partial<TourPlannerWaypoint> = {}): TourPlannerWaypoint => ({
  id,
  lat,
  lng,
  role: 'via',
  ...extra,
});

const ids = (points: TourPlannerWaypoint[]) => points.map((p) => p.id);

describe('the point list helpers', () => {
  it('puts a fixed leg at the end, or after the stop named, past a fixed leg that stop carries', () => {
    const leg = {} as TourFixedLeg;
    const current = [point('a'), point('b', 0, 0, { fixedLeg: leg }), point('c'), point('d')];
    const added = [point('x'), point('y')];
    expect(ids(withFixedLegInserted(current, added))).toEqual(['a', 'b', 'c', 'd', 'x', 'y']);
    expect(ids(withFixedLegInserted(current, added, 'a'))).toEqual(['a', 'x', 'y', 'b', 'c', 'd']);
    expect(ids(withFixedLegInserted(current, added, 'b'))).toEqual(['a', 'b', 'c', 'x', 'y', 'd']);
    expect(ids(withFixedLegInserted(current, added, 'missing'))).toEqual(['a', 'b', 'c', 'd', 'x', 'y']);
  });

  it('moves a point, and both ends of a loop together', () => {
    const line = [point('a', 1, 1), point('b', 2, 2), point('c', 3, 3)];
    expect(withPointMoved(line, 'b', 5, 6).map((p) => [p.lat, p.lng])).toEqual([
      [1, 1],
      [5, 6],
      [3, 3],
    ]);
    const loop = [point('a', 1, 1), point('b', 2, 2), point('c', 1, 1)];
    expect(withPointMoved(loop, 'a', 9, 9).map((p) => [p.lat, p.lng])).toEqual([
      [9, 9],
      [2, 2],
      [9, 9],
    ]);
  });

  it('swaps a point with its neighbour, never past either end', () => {
    const current = [point('a'), point('b'), point('c')];
    expect(ids(withPointSwapped(current, 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(withPointSwapped(current, 'a', -1)).toBe(current);
    expect(withPointSwapped(current, 'c', 1)).toBe(current);
  });

  it('reorders a point before or after another', () => {
    const current = [point('a'), point('b'), point('c')];
    expect(ids(withPointReordered(current, 'a', 'c', 'after'))).toEqual(['b', 'c', 'a']);
    expect(ids(withPointReordered(current, 'c', 'a', 'before'))).toEqual(['c', 'a', 'b']);
    expect(withPointReordered(current, 'a', 'missing', 'after')).toBe(current);
  });
});

function setup({ canEdit = true, saving = false, tourType = 'hike' as PlannableTourType } = {}) {
  const waypointsRef = { current: [point('a'), point('b')] };
  const commitWaypoints = vi.fn(
    (next: TourPlannerWaypoint[] | ((current: TourPlannerWaypoint[]) => TourPlannerWaypoint[])) => {
      waypointsRef.current = typeof next === 'function' ? next(waypointsRef.current) : next;
    }
  );
  const setSelectedWaypointId = vi.fn();
  const { result } = renderHook(() =>
    useWaypointCommands({
      commitWaypoints,
      editPermissionRef: { current: canEdit },
      saveInFlightRef: { current: saving },
      waypointsRef,
      tourTypeRef: { current: tourType },
      setSelectedWaypointId,
    })
  );
  return { result, commitWaypoints, setSelectedWaypointId, waypointsRef };
}

describe('useWaypointCommands', () => {
  it('adds a point as the new end and selects it', () => {
    const { result, waypointsRef, setSelectedWaypointId } = setup();
    act(() => result.current.addWaypoint(4, 5));
    expect(waypointsRef.current).toHaveLength(3);
    expect(setSelectedWaypointId).toHaveBeenCalledWith(waypointsRef.current[2].id);
  });

  it('changes nothing for a viewer who may not edit', () => {
    const { result, commitWaypoints } = setup({ canEdit: false });
    act(() => {
      result.current.addWaypoint(1, 1);
      result.current.removeWaypoint('a');
      result.current.reverse();
      expect(result.current.setWaypointPosition('a', 1, 1)).toBe(false);
    });
    expect(commitWaypoints).not.toHaveBeenCalled();
  });

  it('waits for a save in flight before moving or reversing points', () => {
    const { result, commitWaypoints } = setup({ saving: true });
    act(() => {
      result.current.reverse();
      result.current.returnToStart();
      result.current.reorderWaypoint('a', 'b', 'after');
      expect(result.current.setWaypointPosition('a', 1, 1)).toBe(false);
    });
    expect(commitWaypoints).not.toHaveBeenCalled();
  });

  it('takes a paddler change only on a paddle tour', () => {
    const hike = setup();
    act(() => hike.result.current.editPaddlePoints((current) => current));
    expect(hike.commitWaypoints).not.toHaveBeenCalled();
    const kayak = setup({ tourType: 'kayak' });
    act(() => kayak.result.current.editPaddlePoints((current) => current));
    expect(kayak.commitWaypoints).toHaveBeenCalledTimes(1);
  });

  it('removes a point and lets its selection go', () => {
    const { result, waypointsRef, setSelectedWaypointId } = setup();
    act(() => result.current.removeWaypoint('a'));
    expect(ids(waypointsRef.current)).toEqual(['b']);
    const update = setSelectedWaypointId.mock.calls[0][0] as (current: string | null) => string | null;
    expect(update('a')).toBeNull();
    expect(update('b')).toBe('b');
  });
});
