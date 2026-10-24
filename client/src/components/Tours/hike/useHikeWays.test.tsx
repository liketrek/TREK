import { act, renderHook } from '@testing-library/react';
import type { TourTrailGrade } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import type { RouteWayEdge, RouteWays } from '../bike/routeWays';
import type { RouteWaysState } from '../bike/useRouteWays';
import { useHikeWays } from './useHikeWays';

const hook = vi.hoisted(() => ({
  state: null as unknown,
  input: null as unknown,
  retry: vi.fn(),
}));
vi.mock('../bike/useRouteWays', () => ({
  useRouteWays: (input: unknown) => {
    hook.input = input;
    return { ...(hook.state as object), retry: hook.retry };
  },
}));

// FE-HIKE-WAYS-HOOK-001 to FE-HIKE-WAYS-HOOK-012

const ROUTE: [number, number][] = [
  [47.0, 11.0],
  [47.002, 11.0],
  [47.004, 11.0],
  [47.006, 11.0],
];
const edge = (from: number, wayId: number): RouteWayEdge => ({
  from,
  to: from + 1,
  lengthM: 100,
  // The router's own reading, which no facet may take for a recorded value.
  surface: 'paved',
  way: 'path',
  sac: 'none',
  wayId,
});
const WAYS: RouteWays = { line: ROUTE, edges: [edge(0, 1), edge(1, 2), edge(2, 3)] };
const grade = (id: number, values: Partial<TourTrailGrade>): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
  ...values,
});
const READY: RouteWaysState = {
  status: 'ready',
  ways: WAYS,
  grades: {
    status: 'ready',
    byWay: new Map([
      [1, grade(1, { sac_scale: 'mountain_hiking', surface: 'gravel', highway: 'track' })],
      [2, grade(2, { sac_scale: 'alpine_hiking', surface: 'rock', highway: 'path' })],
    ]),
    unasked: new Set(),
  },
};

function shownHook(state: RouteWaysState, route: [number, number][] | null = ROUTE) {
  hook.state = state;
  const view = renderHook((props: { route: [number, number][] | null }) => useHikeWays({ tripId: 5, ...props }), {
    initialProps: { route },
  });
  act(() => view.result.current.toggle());
  return view;
}

beforeEach(() => {
  hook.state = { status: 'idle', ways: null, grades: null };
  hook.input = null;
  hook.retry.mockReset();
  useTourRouteHighlightStore.getState().clear();
});

describe('useHikeWays (MAP-03, MAP-04)', () => {
  it('FE-HIKE-WAYS-HOOK-001: without a line of two points there is nothing to read and nothing is asked', () => {
    for (const route of [null, ROUTE.slice(0, 1)]) {
      const { result } = renderHook(() => useHikeWays({ tripId: 5, route }));
      expect(result.current.available).toBe(false);
      expect(result.current.status).toBe('off');
      expect(hook.input).toMatchObject({ active: false });
    }
  });

  it('FE-HIKE-WAYS-HOOK-002: off until switched on, then asks for the ways on foot with what OpenStreetMap records', () => {
    const { result } = renderHook(() => useHikeWays({ tripId: 5, route: ROUTE }));
    expect(result.current).toMatchObject({ available: true, shown: false, status: 'off', facet: 'sac', rows: [] });
    expect(hook.input).toMatchObject({ tripId: 5, active: false, route: ROUTE, matching: 'foot', withGrades: true });
    hook.state = { status: 'loading', ways: null, grades: null };
    act(() => result.current.toggle());
    expect(result.current.shown).toBe(true);
    expect(result.current.status).toBe('loading');
    expect(hook.input).toMatchObject({ active: true });
  });

  it('FE-HIKE-WAYS-HOOK-003: says when the ways or their values are on their way, offline or failed', () => {
    const cases: [RouteWaysState, string][] = [
      [{ status: 'offline', ways: null, grades: null }, 'offline'],
      [{ status: 'failed', ways: null, grades: null }, 'failed'],
      [{ ...READY, grades: { status: 'loading', byWay: new Map(), unasked: new Set() } }, 'loading'],
      [{ ...READY, grades: { status: 'offline', byWay: new Map(), unasked: new Set() } }, 'offline'],
      [{ ...READY, grades: null }, 'failed'],
    ];
    for (const [state, status] of cases) {
      const { result, unmount } = shownHook(state);
      expect(result.current.status).toBe(status);
      expect(result.current.rows).toEqual([]);
      unmount();
    }
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();
  });

  it('FE-HIKE-WAYS-HOOK-004: lists the known SAC steps and the unknown, and draws them all along the line', () => {
    const { result } = shownHook(READY);
    expect(result.current.status).toBe('ready');
    expect(result.current.rows.map((row) => [row.key, row.tags])).toEqual([
      ['t2', ['mountain_hiking']],
      ['t4', ['alpine_hiking']],
      ['untagged', []],
    ]);
    expect(result.current.knownShare).toBeCloseTo(2 / 3);
    expect(result.current.highest).toBe(4);
    expect(useTourRouteHighlightStore.getState().highlight).toMatchObject({
      id: 'sac',
      paint: 'unknown',
      paints: ['t2', 't4', 'unknown'],
    });
  });

  it('FE-HIKE-WAYS-HOOK-005: a picked class is drawn alone, picked again every class is drawn again', () => {
    const { result } = shownHook(READY);
    act(() => result.current.focusOn('t4'));
    expect(result.current.focus).toBe('t4');
    expect(useTourRouteHighlightStore.getState().highlight).toMatchObject({
      id: 'sac-t4',
      lines: [ROUTE.slice(1, 3)],
      paints: ['t4'],
    });
    act(() => result.current.focusOn('t4'));
    expect(result.current.focus).toBeNull();
    expect(useTourRouteHighlightStore.getState().highlight?.id).toBe('sac');
  });

  it('FE-HIKE-WAYS-HOOK-006: a hike nobody could be asked about fails once with a retry rather than one unknown row', () => {
    const { result } = shownHook({
      ...READY,
      grades: { status: 'ready', byWay: new Map(), unasked: new Set([1, 2, 3]) },
    });
    expect(result.current.status).toBe('failed');
    expect(result.current.rows).toEqual([]);
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();
    result.current.retry();
    expect(hook.retry).toHaveBeenCalledTimes(1);
  });

  it('FE-HIKE-WAYS-HOOK-007: switched off or left, the map is as it was; a way off the line is never read', () => {
    const { result, unmount } = shownHook(READY);
    act(() => result.current.focusOn('t2'));
    act(() => result.current.toggle());
    expect(result.current.shown).toBe(false);
    expect(result.current.focus).toBeNull();
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();
    act(() => result.current.toggle());
    expect(useTourRouteHighlightStore.getState().highlight?.id).toBe('sac');
    unmount();
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();

    // The tour's own line runs a kilometre east of the ways the router matched: none of them is its way.
    const elsewhere = ROUTE.map(([lat, lng]): [number, number] => [lat, lng + 0.013]);
    const off = shownHook(READY, elsewhere);
    expect(off.result.current.rows.map((row) => row.key)).toEqual(['unmatched']);
    expect(off.result.current.highest).toBeNull();
    act(() => off.result.current.chooseFacet('surface'));
    expect(off.result.current.rows.map((row) => row.key)).toEqual(['unmatched']);
    expect(off.result.current.mostly).toBeNull();
  });

  it('FE-HIKE-WAYS-HOOK-008: while the line is planned anew the card waits for it and reads nothing of the old one', () => {
    hook.state = READY;
    const { result } = renderHook(() => useHikeWays({ tripId: 5, route: ROUTE, current: false }));
    act(() => result.current.toggle());
    expect(result.current.available).toBe(true);
    expect(result.current.status).toBe('loading');
    expect(result.current.rows).toEqual([]);
    expect(hook.input).toMatchObject({ active: true, route: null });
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();
  });

  it('FE-HIKE-WAYS-HOOK-009: the surfaces are the recorded ones, never the router reading, and draw in their own paints', () => {
    const { result } = shownHook(READY);
    act(() => result.current.chooseFacet('surface'));
    expect(result.current.facet).toBe('surface');
    expect(result.current.rows.map((row) => [row.key, row.tags])).toEqual([
      ['gravel', ['gravel']],
      ['rock', ['rock']],
      ['untagged', []],
    ]);
    expect(result.current.highest).toBeNull();
    expect(result.current.mostly?.key).toBe('gravel');
    expect(useTourRouteHighlightStore.getState().highlight).toMatchObject({
      id: 'surface',
      paints: ['surface:gravel', 'surface:rock', 'unknown'],
    });
  });

  it('FE-HIKE-WAYS-HOOK-010: the kinds of way sit apart from the surfaces and the grades; a new facet lets the picked class go', () => {
    const { result } = shownHook(READY);
    act(() => result.current.focusOn('t2'));
    act(() => result.current.chooseFacet('way'));
    expect(result.current.focus).toBeNull();
    expect(result.current.rows.map((row) => row.key)).toEqual(['path', 'track', 'untagged']);
    expect(useTourRouteHighlightStore.getState().highlight?.id).toBe('way');
    act(() => result.current.focusOn('track'));
    expect(useTourRouteHighlightStore.getState().highlight).toMatchObject({ id: 'way-track', paints: ['way:track'] });
  });

  it('FE-HIKE-WAYS-HOOK-011: every facet is read from the one answer, asked once on foot', () => {
    const { result } = shownHook(READY);
    const asked = hook.input;
    act(() => result.current.chooseFacet('surface'));
    act(() => result.current.chooseFacet('way'));
    // The same question on every render: switching facets asks nothing new.
    expect(hook.input).toEqual(asked);
    expect(result.current.status).toBe('ready');
  });

  it('FE-HIKE-WAYS-HOOK-012: a run is read the same way, matched as a run, and hands the router answer on once read (RUN-02)', () => {
    hook.state = READY;
    const { result } = renderHook(() => useHikeWays({ tripId: 5, route: ROUTE, matching: 'run' }));
    expect(result.current.routeWays).toBeNull();
    act(() => result.current.toggle());
    expect(hook.input).toMatchObject({ active: true, matching: 'run', withGrades: true });
    expect(result.current.rows.map((row) => row.key)).toEqual(['t2', 't4', 'untagged']);
    expect(result.current.routeWays).toBe(WAYS);
  });
});
