import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import { useHighlightedRoute } from './useHighlightedRoute';

const LINE: [number, number][] = [
  [47, 11],
  [47.01, 11],
];

describe('useHighlightedRoute (BIK-01 to BIK-05, MAP-03)', () => {
  it('lays the highlight over the route while shown, and leaves the route alone otherwise', () => {
    act(() => useTourRouteHighlightStore.getState().show({ id: 'surface-gravel', lines: [LINE], paint: 'gravel' }));
    const shown = renderHook(() => useHighlightedRoute(true, [LINE], null, null));
    expect(shown.result.current.route).toHaveLength(2);
    expect(shown.result.current.colors?.[1]).toMatchObject({ line: expect.any(String), casing: expect.any(String) });
    const hidden = renderHook(() => useHighlightedRoute(false, [LINE], null, null));
    expect(hidden.result.current.route).toEqual([LINE]);
    act(() => useTourRouteHighlightStore.getState().clear());
    expect(shown.result.current.route).toEqual([LINE]);
  });

  it('draws the SAC grades of a hike in their own paints beside the bike paints (MAP-03)', () => {
    act(() =>
      useTourRouteHighlightStore
        .getState()
        .show({ id: 'sac', lines: [LINE, LINE], paint: 'unknown', paints: ['t3', 'unknown'] })
    );
    const { result } = renderHook(() => useHighlightedRoute(true, [LINE], null, null));
    expect(result.current.route).toHaveLength(3);
    expect(result.current.colors?.slice(1)).toEqual([
      { line: expect.any(String), casing: expect.any(String) },
      { line: expect.any(String), casing: expect.any(String) },
    ]);
    act(() => useTourRouteHighlightStore.getState().clear());
  });
});
