import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { _resetNativeGeolocation, installNativeGeolocation } from './geolocation';
import { isNativeIos } from './platform';
import { TrekShell, type NativeLocationPayload } from './trekShell';

vi.mock('./platform', () => ({ isNativeIos: vi.fn() }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: { startLocation: vi.fn(), stopLocation: vi.fn(), addListener: vi.fn() },
}));

let emit: (payload: NativeLocationPayload) => void = () => {};
const original = navigator.geolocation;

beforeEach(() => {
  _resetNativeGeolocation();
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: original });
  vi.mocked(isNativeIos).mockReturnValue(true);
  vi.mocked(hasNativeFeature).mockReturnValue(true);
  vi.mocked(TrekShell.startLocation).mockReset().mockResolvedValue();
  vi.mocked(TrekShell.stopLocation).mockReset().mockResolvedValue();
  vi.mocked(TrekShell.addListener)
    .mockReset()
    .mockImplementation(async (_event, listener) => {
      emit = listener;
      return { remove: async () => {} };
    });
});

const FIX: NativeLocationPayload = {
  latitude: 35.68,
  longitude: 139.76,
  accuracy: 12,
  altitude: null,
  speed: null,
  heading: 90,
  timestamp: 1000,
};

describe('native geolocation', () => {
  it('answers navigator.geolocation from the app, and stops the stream when nobody listens', async () => {
    expect(installNativeGeolocation()).toBe(true);
    const seen: number[] = [];
    const id = navigator.geolocation.watchPosition((p) => seen.push(p.coords.latitude), undefined, {
      enableHighAccuracy: true,
    });
    expect(TrekShell.startLocation).toHaveBeenCalledWith({ highAccuracy: true });
    await Promise.resolve();
    emit(FIX);
    emit({ ...FIX, latitude: 35.7 });
    expect(seen).toEqual([35.68, 35.7]);

    navigator.geolocation.clearWatch(id);
    expect(TrekShell.stopLocation).toHaveBeenCalledTimes(1);
  });

  it('settles a one-off request with the first fix, and passes a denial on as the Geolocation error', async () => {
    installNativeGeolocation();
    const once = vi.fn();
    navigator.geolocation.getCurrentPosition(once);
    await Promise.resolve();
    emit(FIX);
    emit(FIX);
    expect(once).toHaveBeenCalledTimes(1);
    expect(TrekShell.stopLocation).toHaveBeenCalledTimes(1);

    const failed = vi.fn();
    navigator.geolocation.getCurrentPosition(vi.fn(), failed);
    emit({ error: { code: 1, message: 'denied' } });
    expect(failed.mock.calls[0][0]).toMatchObject({ code: 1, PERMISSION_DENIED: 1 });
  });

  it('leaves the browser API alone outside an iOS binary with the feature', () => {
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(installNativeGeolocation()).toBe(false);
    expect(navigator.geolocation).toBe(original);
  });
});
