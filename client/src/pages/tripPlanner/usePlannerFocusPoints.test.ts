// FE-TP-FOCUSPOINTS-001 to FE-TP-FOCUSPOINTS-004: what the tour planner's map frames: a browsed wanderer trail,
// the recorded track or the open tour's control points, and with nothing open the area the plan map last showed,
// else the trip's places.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import type { Place } from '../../types';
import { usePlannerFocusPoints } from './usePlannerFocusPoints';

const PLACES = [
  { id: 1, lat: 48, lng: 11 },
  { id: 2, lat: Number.NaN, lng: 11 },
] as unknown as Place[];

function planner(overrides: Partial<Record<keyof TourPlannerController, unknown>> = {}): TourPlannerController {
  return {
    mode: { type: 'neutral' },
    readOnlyGpxAnalysis: null,
    waypoints: [],
    newDraftGeneration: 0,
    ...overrides,
  } as unknown as TourPlannerController;
}

const closed = { open: false, line: null };

describe('usePlannerFocusPoints', () => {
  it('FE-TP-FOCUSPOINTS-001: with nothing open the trip places with a position are framed', () => {
    const { result } = renderHook(() => usePlannerFocusPoints('tour-planner', PLACES, planner(), closed));
    expect(result.current.focusPoints).toEqual([[48, 11]]);
  });

  it('FE-TP-FOCUSPOINTS-002: the area the plan map last showed wins once the planner opens again', () => {
    const { result, rerender } = renderHook(({ tab }) => usePlannerFocusPoints(tab, PLACES, planner(), closed), {
      initialProps: { tab: 'plan' },
    });
    act(() => {
      result.current.lastPlanMapViewportRef.current = { south: 49, west: 12, north: 49.5, east: 12.5 };
    });
    rerender({ tab: 'tour-planner' });
    expect(result.current.focusPoints).toEqual([
      [49, 12],
      [49.5, 12.5],
    ]);
  });

  it('FE-TP-FOCUSPOINTS-003: a recorded track, a draft and a saved tour frame their own line or points', () => {
    const line: [number, number][] = [
      [49.2, 12],
      [49.2, 12.01],
    ];
    const waypoints = [
      { id: 'a', lat: 47, lng: 11 },
      { id: 'b', lat: 47.1, lng: 11.1 },
    ];
    const gpx = planner({ mode: { type: 'view-gpx' }, readOnlyGpxAnalysis: { routeCoordinates: line } });
    expect(
      renderHook(() => usePlannerFocusPoints('tour-planner', PLACES, gpx, closed)).result.current.focusPoints
    ).toBe(line);
    for (const type of ['new-draft', 'edit-saved']) {
      const open = planner({ mode: { type }, waypoints });
      expect(
        renderHook(() => usePlannerFocusPoints('tour-planner', PLACES, open, closed)).result.current.focusPoints
      ).toEqual([
        [47, 11],
        [47.1, 11.1],
      ]);
    }
  });

  it('FE-TP-FOCUSPOINTS-004: a browsed wanderer trail frames its line, the fallback while it has none', () => {
    const trail: [number, number][] = [[46, 10]];
    expect(
      renderHook(() => usePlannerFocusPoints('tour-planner', PLACES, planner(), { open: true, line: trail })).result
        .current.focusPoints
    ).toBe(trail);
    expect(
      renderHook(() => usePlannerFocusPoints('tour-planner', PLACES, planner(), { open: true, line: null })).result
        .current.focusPoints
    ).toEqual([[48, 11]]);
  });
});
