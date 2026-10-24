// FE-TP-TRACKPICK-001 to FE-TP-TRACKPICK-004: a click on a recorded paddle track while a marking tool is on marks
// the spot on the line (PAD-03), one too far from it is refused, and otherwise the planner's own click stays.
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { loadTrackMarks, startTrackPick, useTrackMarkToolStore } from '../../store/trackMarkToolStore';
import { useTrackLinePick } from './useTrackLinePick';

const LINE: [number, number][] = [
  [49.2, 12],
  [49.2, 12.01],
];

function track(mode: 'view-gpx' | 'edit-saved' = 'view-gpx') {
  return {
    mode:
      mode === 'view-gpx'
        ? { type: 'view-gpx', placeId: 40, tour: { place_id: 40 } }
        : { type: 'edit-saved', placeId: 40 },
    readOnlyGpxAnalysis: { routeCoordinates: LINE },
  } as unknown as Pick<TourPlannerController, 'mode' | 'readOnlyGpxAnalysis'>;
}

const passThrough = (handler: ((lat: number, lng: number) => void) | undefined) => handler;

beforeEach(() => {
  loadTrackMarks(40, null, { paddle: null, portage: null });
});

describe('useTrackLinePick', () => {
  it('FE-TP-TRACKPICK-001: without a marking tool the planner keeps its own click', () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() => useTrackLinePick(track(), true, passThrough, onAdd));
    expect(result.current.pickOnLine).toBe(false);
    expect(result.current.onAddOrMark).toBe(onAdd);
  });

  it('FE-TP-TRACKPICK-002: with the lock tool on, a click on the line places the lock there', () => {
    startTrackPick('lock');
    const { result } = renderHook(() => useTrackLinePick(track(), true, passThrough, undefined));
    expect(result.current.pickOnLine).toBe(true);
    result.current.onAddOrMark?.(49.2, 12.005);
    const { marks, dirty } = useTrackMarkToolStore.getState();
    expect(dirty).toBe(true);
    expect(marks.locks).toHaveLength(1);
    expect(marks.locks[0]?.at_m).toBeGreaterThan(300);
  });

  it('FE-TP-TRACKPICK-003: a click far from the line is refused', () => {
    startTrackPick('lock');
    const { result } = renderHook(() => useTrackLinePick(track(), true, passThrough, undefined));
    result.current.onAddOrMark?.(49.25, 12.005);
    expect(useTrackMarkToolStore.getState()).toMatchObject({ refused: 'off_line', dirty: false });
  });

  it('FE-TP-TRACKPICK-004: a viewer, or a tour that is no recorded track, marks nothing', () => {
    startTrackPick('lock');
    expect(renderHook(() => useTrackLinePick(track(), false, passThrough, undefined)).result.current).toEqual({
      pickOnLine: false,
      onAddOrMark: undefined,
    });
    expect(
      renderHook(() => useTrackLinePick(track('edit-saved'), true, passThrough, undefined)).result.current.pickOnLine
    ).toBe(false);
  });
});
