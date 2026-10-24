import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaypointPlaceNames } from './useWaypointPlaceNames';

const geocode = vi.hoisted(() => ({ placeName: vi.fn(), knownName: vi.fn() }));
vi.mock('../../../repo/reverseGeocodeRepo', () => ({ reverseGeocodeRepo: geocode }));
vi.mock('../../../hooks/usePlaceLanguage', () => ({ usePlaceLanguage: () => 'de' }));

beforeEach(() => {
  vi.useFakeTimers();
  geocode.placeName.mockReset().mockResolvedValue('Fresh lookup');
  geocode.knownName.mockReset().mockReturnValue(undefined);
});
afterEach(() => vi.useRealTimers());

describe('useWaypointPlaceNames', () => {
  it('shows names answered before at once, without asking again', () => {
    geocode.knownName.mockImplementation((lat: number) => (lat === 47 ? 'Kramerplateau' : undefined));
    const { result } = renderHook(() => useWaypointPlaceNames([{ id: 'a', lat: 47, lng: 11 }]));

    expect(result.current).toEqual({ a: 'Kramerplateau' });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(geocode.placeName).not.toHaveBeenCalled();
  });

  it('asks only for the points it does not know, once they rest', async () => {
    geocode.knownName.mockImplementation((lat: number) => (lat === 47 ? 'Kramerplateau' : undefined));
    const points = [
      { id: 'a', lat: 47, lng: 11 },
      { id: 'b', lat: 47.1, lng: 11 },
    ];
    const { result } = renderHook(() => useWaypointPlaceNames(points));
    expect(geocode.placeName).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(geocode.placeName).toHaveBeenCalledTimes(1);
    expect(geocode.placeName).toHaveBeenCalledWith(47.1, 11, 'de');
    expect(result.current).toEqual({ a: 'Kramerplateau', b: 'Fresh lookup' });
  });

  it('never shows a moved point under the name of where it was', async () => {
    const { result, rerender } = renderHook(({ points }) => useWaypointPlaceNames(points), {
      initialProps: { points: [{ id: 'a', lat: 47.2, lng: 11 }] },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current).toEqual({ a: 'Fresh lookup' });

    geocode.placeName.mockReturnValue(new Promise(() => undefined));
    rerender({ points: [{ id: 'a', lat: 47.3, lng: 11 }] });
    expect(result.current).toEqual({});
  });

  it('keeps the coordinates when a lookup fails', async () => {
    geocode.placeName.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useWaypointPlaceNames([{ id: 'a', lat: 47.4, lng: 11 }]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current).toEqual({});
  });
});
