// FE-ACT-COMPARE-HOOK-001 to FE-ACT-COMPARE-HOOK-004
// ACT-02 from the tour's detail: one actual track at a time is compared on
// the map, and the comparison ends with the detail or with the track's link.
import { act, renderHook } from '@testing-library/react';
import type { TourActivity } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import { useActivityComparison } from './useActivityComparison';

const linked = (trackPlaceId: number) => ({ id: trackPlaceId, track: { place_id: trackPlaceId } }) as TourActivity;
const activities = [linked(20), linked(21)];

beforeEach(() => {
  useTourActivityCompareStore.getState().clear();
});

describe('useActivityComparison (ACT-02)', () => {
  it('FE-ACT-COMPARE-HOOK-001: switches one track on, another instead, and off again', () => {
    const { result } = renderHook(() => useActivityComparison(7, activities));
    expect(result.current.comparedTrack).toBeNull();

    act(() => result.current.toggle(20));
    expect(result.current.comparedTrack).toBe(20);
    expect(useTourActivityCompareStore.getState().comparison).toEqual({ tourPlaceId: 7, trackPlaceId: 20 });

    act(() => result.current.toggle(21));
    expect(result.current.comparedTrack).toBe(21);

    act(() => result.current.toggle(21));
    expect(result.current.comparedTrack).toBeNull();
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();
  });

  it("FE-ACT-COMPARE-HOOK-002: another tour's comparison is not this one's, and is left alone when this detail closes", () => {
    useTourActivityCompareStore.getState().show({ tourPlaceId: 9, trackPlaceId: 20 });
    const { result, unmount } = renderHook(() => useActivityComparison(7, activities));
    expect(result.current.comparedTrack).toBeNull();
    unmount();
    expect(useTourActivityCompareStore.getState().comparison).toEqual({ tourPlaceId: 9, trackPlaceId: 20 });
  });

  it('FE-ACT-COMPARE-HOOK-003: closing the detail ends its comparison', () => {
    const { result, unmount } = renderHook(() => useActivityComparison(7, activities));
    act(() => result.current.toggle(20));
    unmount();
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();
  });

  it('FE-ACT-COMPARE-HOOK-004: a track no longer linked stops being compared; one still loading is kept', () => {
    const { result, rerender } = renderHook(({ list }) => useActivityComparison(7, list), {
      initialProps: { list: activities as TourActivity[] | null },
    });
    act(() => result.current.toggle(20));

    rerender({ list: null });
    expect(result.current.comparedTrack).toBe(20);

    rerender({ list: [linked(21)] });
    expect(result.current.comparedTrack).toBeNull();
  });
});
