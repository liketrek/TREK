// FE-TP-LOCSEARCH-001 to FE-TP-LOCSEARCH-006
//
// The tour planner's map location search: a picked result only moves the camera,
// a focus the paddle checklist asks for does too and the newest wins, and the
// planner's own focus takes over again once it bumps its focus key.
import { act, renderHook } from '@testing-library/react';
import { useMapLocationSearch } from './useMapLocationSearch';

const PLANNER_POINTS: [number, number][] = [
  [48, 11],
  [48.1, 11.1],
];
const PICK = { name: 'Zugspitze', lat: 47.42, lng: 10.98 };

describe('useMapLocationSearch', () => {
  it('FE-TP-LOCSEARCH-001: without a pick the planner frames its own points', () => {
    const { result } = renderHook(() => useMapLocationSearch(3, PLANNER_POINTS));

    expect(result.current.mapFocusPoints).toBe(PLANNER_POINTS);
    expect(result.current.mapFocusKey).toBe('tour:3');
    expect(result.current.locationSearch.value).toBeNull();
  });

  it('FE-TP-LOCSEARCH-002: a pick frames the picked point under a fresh key each time', () => {
    const { result } = renderHook(() => useMapLocationSearch(3, PLANNER_POINTS));

    act(() => result.current.locationSearch.onChange(PICK));
    expect(result.current.locationSearch.value).toEqual(PICK);
    expect(result.current.mapFocusPoints).toEqual([[47.42, 10.98]]);
    expect(result.current.mapFocusKey).toBe('tour:3:search:1');

    act(() => result.current.locationSearch.onChange(PICK));
    expect(result.current.mapFocusKey).toBe('tour:3:search:2');
  });

  it('FE-TP-LOCSEARCH-003: clearing the field keeps the camera where the pick put it', () => {
    const { result } = renderHook(() => useMapLocationSearch(3, PLANNER_POINTS));

    act(() => result.current.locationSearch.onChange(PICK));
    act(() => result.current.locationSearch.onChange(null));

    expect(result.current.locationSearch.value).toBeNull();
    expect(result.current.mapFocusKey).toBe('tour:3:search:1');
  });

  it('FE-TP-LOCSEARCH-004: a new planner focus key wins over an older pick', () => {
    const { result, rerender } = renderHook(({ key }) => useMapLocationSearch(key, PLANNER_POINTS), {
      initialProps: { key: 3 },
    });

    act(() => result.current.locationSearch.onChange(PICK));
    rerender({ key: 4 });

    expect(result.current.mapFocusPoints).toBe(PLANNER_POINTS);
    expect(result.current.mapFocusKey).toBe('tour:4');
  });

  it('FE-TP-LOCSEARCH-005: a focus the paddle checklist asks for frames its area, and the newest of it and a pick wins', () => {
    const weir: [number, number][] = [
      [49.199, 12.004],
      [49.201, 12.006],
    ];
    const { result, rerender } = renderHook(({ focus }) => useMapLocationSearch(3, PLANNER_POINTS, focus), {
      initialProps: { focus: null as { seq: number; points: [number, number][] } | null },
    });

    rerender({ focus: { seq: 1, points: weir } });
    expect(result.current.mapFocusPoints).toEqual(weir);
    expect(result.current.mapFocusKey).toBe('tour:3:paddle:1');

    act(() => result.current.locationSearch.onChange(PICK));
    expect(result.current.mapFocusKey).toBe('tour:3:search:2');

    rerender({ focus: { seq: 2, points: weir } });
    expect(result.current.mapFocusKey).toBe('tour:3:paddle:3');
    expect(result.current.mapFocusPoints).toEqual(weir);
  });

  it('FE-TP-LOCSEARCH-006: a focus already there when the planner opens, or one without points, moves nothing; a new planner key wins', () => {
    const weir: [number, number][] = [[49.2, 12.005]];
    const { result, rerender } = renderHook(({ key, focus }) => useMapLocationSearch(key, PLANNER_POINTS, focus), {
      initialProps: { key: 3, focus: { seq: 4, points: weir } as { seq: number; points: [number, number][] } },
    });
    expect(result.current.mapFocusKey).toBe('tour:3');

    rerender({ key: 3, focus: { seq: 5, points: [] } });
    expect(result.current.mapFocusKey).toBe('tour:3');

    rerender({ key: 3, focus: { seq: 6, points: weir } });
    expect(result.current.mapFocusKey).toBe('tour:3:paddle:1');
    rerender({ key: 4, focus: { seq: 6, points: weir } });
    expect(result.current.mapFocusKey).toBe('tour:4');
  });
});
