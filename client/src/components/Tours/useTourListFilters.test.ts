import { act, renderHook } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { useTourListFilters } from './useTourListFilters';

const tour = (over: Partial<TourListItem>): TourListItem =>
  ({
    place_id: 1,
    name: 'Ridge',
    tour_type: 'hike',
    distance: 5,
    elevation_gain: null,
    elevation_loss: null,
    duration: null,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: 2,
    planned: false,
    caution: false,
    origin: 'trek',
    ...over,
  }) as TourListItem;

const tours = [
  tour({ place_id: 1, origin: 'trek', max_hiking_difficulty: 2, planned: true }),
  tour({ place_id: 2, origin: 'gpx', max_hiking_difficulty: null }),
  tour({ place_id: 3, origin: 'wanderer', max_hiking_difficulty: 1 }),
  tour({ place_id: 4, origin: 'gpx', max_hiking_difficulty: 3, planned: true }),
];
const ids = (list: readonly TourListItem[]) => list.map((item) => item.place_id);

describe('useTourListFilters (PR1-13)', () => {
  it('offers only the dimensions the list varies in, each value with its count', () => {
    const { result } = renderHook(() => useTourListFilters(tours));
    expect(result.current.facets.origin).toEqual([
      { value: 'trek', count: 1 },
      { value: 'gpx', count: 2 },
      { value: 'wanderer', count: 1 },
    ]);
    expect(result.current.facets.grade.map((option) => option.value)).toEqual([1, 2, 3]);
    // One tour type only: no type filter.
    expect(result.current.facets.type).toEqual([]);
    expect(result.current.hasFacets).toBe(true);
  });

  it('a small list that does not vary keeps its single status filter', () => {
    const { result } = renderHook(() => useTourListFilters([tour({ place_id: 1 }), tour({ place_id: 2 })]));
    expect(result.current.hasFacets).toBe(false);
  });

  it('narrows by status and dimensions together, counts follow, a second choice of a value clears it', () => {
    const { result } = renderHook(() => useTourListFilters(tours));
    act(() => result.current.select('origin', 'gpx'));
    expect(ids(result.current.filtered)).toEqual([2, 4]);
    expect(result.current.activeFacets).toBe(1);
    // A GPX import without a grade drops out under a grade, it is not counted as one.
    act(() => result.current.select('grade', 3));
    expect(ids(result.current.filtered)).toEqual([4]);
    act(() => result.current.setStatus('unplanned'));
    expect(result.current.filtered).toEqual([]);
    expect(result.current.emptyByFilter).toBe(true);
    expect(result.current.statusCounts).toEqual({ all: 4, unplanned: 2, planned: 2 });

    act(() => result.current.select('grade', 3));
    expect(ids(result.current.filtered)).toEqual([2]);
    act(() => result.current.reset());
    expect(ids(result.current.filtered)).toEqual([1, 2, 3, 4]);
    expect(result.current.activeFacets).toBe(0);
  });

  it('an empty list is empty, not empty by a filter', () => {
    const { result } = renderHook(() => useTourListFilters([]));
    expect(result.current.emptyByFilter).toBe(false);
  });
});
