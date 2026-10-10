import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Place } from '../../types';

const thumbCallbacks = new Map<string, (thumb: string) => void>();

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => undefined),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn((key: string, cb: (thumb: string) => void) => {
    thumbCallbacks.set(key, cb);
    return () => {
      thumbCallbacks.delete(key);
    };
  }),
  getAllThumbs: vi.fn(() => ({ seeded: 'data:seed' })),
}));

import * as photoService from '../../services/photoService';
import { useAuthStore } from '../../store/authStore';
import { useMarkerThumbs } from './useMarkerThumbs';

function place(over: Partial<Place>): Place {
  return { id: 1, name: 'P', lat: 48, lng: 2, image_url: null, google_place_id: null, osm_id: null, ...over } as Place;
}

let frames: FrameRequestCallback[] = [];

beforeEach(() => {
  frames = [];
  thumbCallbacks.clear();
  vi.clearAllMocks();
  vi.mocked(photoService.getCached).mockReturnValue(undefined);
  vi.mocked(photoService.isLoading).mockReturnValue(false);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  useAuthStore.setState({ placesPhotosEnabled: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function flushFrames() {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((cb) => cb(0)));
}

describe('useMarkerThumbs', () => {
  it('starts from the thumbs already cached', () => {
    const { result } = renderHook(() => useMarkerThumbs([]));
    expect(result.current).toEqual({ seeded: 'data:seed' });
  });

  it('fetches a missing photo by its provider id, else by its coordinates', () => {
    renderHook(() =>
      useMarkerThumbs([place({ id: 1, google_place_id: 'gp-1', name: 'Tower' }), place({ id: 2, lat: 50, lng: 3 })])
    );
    expect(photoService.fetchPhoto).toHaveBeenCalledWith('gp-1', 'gp-1', 48, 2, 'Tower');
    expect(photoService.fetchPhoto).toHaveBeenCalledWith('50,3', 'coords:50:3', 50, 3, 'P');
  });

  it('prefers the picked provider photo over the place id', () => {
    const url = '/api/maps/place-photo/abc';
    renderHook(() => useMarkerThumbs([place({ image_url: url, google_place_id: 'gp-1' })]));
    expect(photoService.fetchPhoto).toHaveBeenCalledWith(url, url, 48, 2, 'P');
  });

  it('never fetches for a custom image, a place without identity or one already loading', () => {
    vi.mocked(photoService.isLoading).mockImplementation((key) => key === 'busy');
    renderHook(() =>
      useMarkerThumbs([
        place({ id: 1, image_url: '/uploads/places/own.jpg' }),
        place({ id: 2, lat: null as never, lng: null as never }),
        place({ id: 3, google_place_id: 'busy' }),
      ])
    );
    expect(photoService.fetchPhoto).not.toHaveBeenCalled();
    expect(photoService.onThumbReady).toHaveBeenCalledTimes(1);
  });

  it('does nothing while place photos are switched off', () => {
    useAuthStore.setState({ placesPhotosEnabled: false });
    renderHook(() => useMarkerThumbs([place({ google_place_id: 'gp-1' })]));
    expect(photoService.fetchPhoto).not.toHaveBeenCalled();
    expect(photoService.onThumbReady).not.toHaveBeenCalled();
  });

  it('batches thumbs arriving together into one frame', () => {
    vi.mocked(photoService.getCached).mockImplementation((key) =>
      key === 'gp-1' ? ({ thumbDataUrl: 'data:one' } as never) : undefined
    );
    const { result } = renderHook(() =>
      useMarkerThumbs([place({ id: 1, google_place_id: 'gp-1' }), place({ id: 2, google_place_id: 'gp-2' })])
    );
    act(() => thumbCallbacks.get('gp-2')!('data:two'));
    expect(frames).toHaveLength(1);
    flushFrames();
    expect(result.current).toEqual({ seeded: 'data:seed', 'gp-1': 'data:one', 'gp-2': 'data:two' });
  });

  it('keeps the same object when a frame brings nothing new', () => {
    vi.mocked(photoService.getCached).mockReturnValue({ thumbDataUrl: 'data:seed' } as never);
    const { result } = renderHook(() => useMarkerThumbs([place({ google_place_id: 'seeded' })]));
    const before = result.current;
    flushFrames();
    expect(result.current).toBe(before);
  });

  it('restarts only when a picture source changes, and cleans up the old listeners', () => {
    const first = [place({ id: 1, google_place_id: 'gp-1' })];
    const { rerender } = renderHook(({ places }) => useMarkerThumbs(places), { initialProps: { places: first } });
    expect(photoService.onThumbReady).toHaveBeenCalledTimes(1);

    rerender({ places: [place({ id: 1, google_place_id: 'gp-1' })] });
    expect(photoService.onThumbReady).toHaveBeenCalledTimes(1);

    rerender({ places: [place({ id: 1, google_place_id: 'gp-9' })] });
    expect(photoService.onThumbReady).toHaveBeenCalledTimes(2);
    expect([...thumbCallbacks.keys()]).toEqual(['gp-9']);
  });

  it('cancels a pending frame when it unmounts', () => {
    const { unmount } = renderHook(() => useMarkerThumbs([place({ google_place_id: 'gp-1' })]));
    act(() => thumbCallbacks.get('gp-1')!('data:one'));
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
