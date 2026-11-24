// FE-SHARED-PLACEPHOTO-001 to FE-SHARED-PLACEPHOTO-005
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { fetchPhoto, getCached } from '../../services/photoService';
import { useAuthStore } from '../../store/authStore';
import { usePlacePhoto } from './usePlacePhoto';

vi.mock('../../services/photoService', () => ({ fetchPhoto: vi.fn(), getCached: vi.fn() }));

const PROXY = '/api/maps/place-photo/ChIJ123/bytes';

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  vi.mocked(getCached).mockReturnValue(undefined);
  vi.mocked(fetchPhoto).mockImplementation((_key, _id, _lat, _lng, _name, callback) => {
    callback?.({ photoUrl: PROXY, thumbDataUrl: null });
  });
});

describe('usePlacePhoto (#2629)', () => {
  it("FE-SHARED-PLACEPHOTO-001: the place's own picture wins and asks the provider for nothing", () => {
    const { result } = renderHook(() =>
      usePlacePhoto({ name: 'Dom', image_url: '/uploads/places/dom.jpg', google_place_id: 'ChIJ123' })
    );
    expect(result.current).toBe('/uploads/places/dom.jpg');
    expect(fetchPhoto).not.toHaveBeenCalled();
  });

  it('FE-SHARED-PLACEPHOTO-002: without one, the provider picture is asked by its id through the shared cache', () => {
    const { result } = renderHook(() =>
      usePlacePhoto({ name: 'Dom', google_place_id: 'ChIJ123', lat: 50.9, lng: 6.9 })
    );
    expect(fetchPhoto).toHaveBeenCalledWith('ChIJ123', 'ChIJ123', 50.9, 6.9, 'Dom', expect.any(Function));
    expect(result.current).toBe(PROXY);
  });

  it('FE-SHARED-PLACEPHOTO-003: a place known only by its position gets no picture of its surroundings', () => {
    const { result } = renderHook(() => usePlacePhoto({ name: 'Somewhere', lat: 50.9, lng: 6.9 }));
    expect(fetchPhoto).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('FE-SHARED-PLACEPHOTO-004: with photos switched off nothing is asked and nothing is shown', () => {
    seedStore(useAuthStore, { placesPhotosEnabled: false });
    const { result } = renderHook(() => usePlacePhoto({ name: 'Dom', osm_id: 'way:42' }));
    expect(fetchPhoto).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("FE-SHARED-PLACEPHOTO-005: the next place never shows the previous one's picture while its own loads", () => {
    vi.mocked(fetchPhoto).mockImplementation((key, _id, _lat, _lng, _name, callback) => {
      if (key === 'ChIJ123') callback?.({ photoUrl: PROXY, thumbDataUrl: null });
    });
    const { result, rerender } = renderHook(({ id }) => usePlacePhoto({ name: 'Stop', google_place_id: id }), {
      initialProps: { id: 'ChIJ123' },
    });
    expect(result.current).toBe(PROXY);

    rerender({ id: 'ChIJ456' });
    expect(result.current).toBeNull();
  });
});
