// CW-03: a city walk's progress on one of its days, read alike by the day rows of the desktop and the phone.
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTourVisitStore } from '../../../store/tourVisitStore';
import { useDayVisits, useWalkProgress, walkProgressOf } from './walkProgress';

const walk = { tour_type: 'walk', station_count: 5 } as const;

beforeEach(() => useTourVisitStore.setState({ tripId: null, byAssignment: {} }));

describe('walkProgressOf', () => {
  it('says nothing for a hike, a walk without stops, or a day without marks', () => {
    const visits = { 'stop-01': 'visited' } as const;
    expect(walkProgressOf({ tour_type: 'hike', station_count: 5 }, visits)).toBeNull();
    expect(walkProgressOf({ ...walk, station_count: 0 }, visits)).toBeNull();
    expect(walkProgressOf({ ...walk, station_count: null }, visits)).toBeNull();
    expect(walkProgressOf({ tour_type: 'walk' }, visits)).toBeNull();
    expect(walkProgressOf(walk, undefined)).toBeNull();
    expect(walkProgressOf(walk, {})).toBeNull();
  });

  it('counts the visited stops of all of them, a skip as marked but not visited', () => {
    const visits = { 'stop-01': 'visited', 'stop-02': 'visited', 'stop-03': 'skipped' } as const;
    expect(walkProgressOf(walk, visits)).toEqual({ visited: 2, total: 5 });
    expect(walkProgressOf(walk, { 'stop-03': 'skipped' })).toEqual({ visited: 0, total: 5 });
  });

  it('never counts more visited stops than the walk has', () => {
    const visits = { 'stop-01': 'visited', 'stop-02': 'visited', 'stop-03': 'visited' } as const;
    expect(walkProgressOf({ ...walk, station_count: 2 }, visits)).toEqual({ visited: 2, total: 2 });
  });
});

describe('useWalkProgress', () => {
  it("reads the day's visits from the store, and nothing without a day", () => {
    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited' }, 10: { 'stop-02': 'skipped' } } });
    expect(renderHook(() => useWalkProgress(walk, 9)).result.current).toEqual({ visited: 1, total: 5 });
    expect(renderHook(() => useWalkProgress(walk, 10)).result.current).toEqual({ visited: 0, total: 5 });
    expect(renderHook(() => useWalkProgress(walk, 11)).result.current).toBeNull();
    expect(renderHook(() => useWalkProgress(walk, undefined)).result.current).toBeNull();
    expect(renderHook(() => useDayVisits(null)).result.current).toBeUndefined();
    expect(renderHook(() => useDayVisits(9)).result.current).toEqual({ 'stop-01': 'visited' });
  });
});
