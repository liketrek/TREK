// FE-HOOK-GEO-001 to FE-HOOK-GEO-025
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { GeoOnceError, getCurrentPositionOnce, useGeolocation } from './useGeolocation';

type WatchSuccess = (pos: GeolocationPosition) => void;
type WatchFailure = (err: GeolocationPositionError) => void;

let successCb: WatchSuccess | null = null;
let errorCb: WatchFailure | null = null;
let watchPosition: ReturnType<typeof vi.fn>;
let clearWatch: ReturnType<typeof vi.fn>;

function fix(over: Partial<GeolocationCoordinates> = {}, timestamp = 1_700_000_000_000): GeolocationPosition {
  return {
    coords: { latitude: 48.2, longitude: 16.37, accuracy: 12, heading: null, speed: null, altitude: null, altitudeAccuracy: null, ...over },
    timestamp,
  } as GeolocationPosition;
}

function geoError(code: number, message = 'Location unavailable'): GeolocationPositionError {
  return { code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError;
}

/** Dispatches an orientation event the hook's listener will pick up. */
function orient(props: Record<string, unknown>): void {
  const ev = new Event('deviceorientationabsolute');
  Object.assign(ev, props);
  window.dispatchEvent(ev);
}

beforeEach(() => {
  successCb = null;
  errorCb = null;
  watchPosition = vi.fn((ok: WatchSuccess, fail: WatchFailure) => {
    successCb = ok;
    errorCb = fail;
    return 7;
  });
  clearWatch = vi.fn();
  Object.defineProperty(navigator, 'geolocation', {
    value: { watchPosition, clearWatch },
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useGeolocation', () => {
  it('FE-HOOK-GEO-001: starts off with nothing tracked', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.mode).toBe('off');
    expect(result.current.position).toBeNull();
    expect(result.current.error).toBeNull();
    expect(watchPosition).not.toHaveBeenCalled();
  });

  it('FE-HOOK-GEO-002: cycles off → show → follow → off', async () => {
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.cycleMode());
    expect(result.current.mode).toBe('show');
    expect(watchPosition).toHaveBeenCalledTimes(1);

    await act(() => result.current.cycleMode());
    expect(result.current.mode).toBe('follow');

    await act(() => result.current.cycleMode());
    expect(result.current.mode).toBe('off');
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('FE-HOOK-GEO-003: requests a high-accuracy watch', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    expect(watchPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    });
  });

  it('FE-HOOK-GEO-004: maps a fix onto the position shape', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    act(() => successCb!(fix({ heading: 90, speed: 3.5 })));

    expect(result.current.position).toEqual({
      lat: 48.2, lng: 16.37, accuracy: 12, heading: 90, speed: 3.5, timestamp: 1_700_000_000_000,
    });
  });

  it('FE-HOOK-GEO-005: reports an error but stays subscribed when the fix merely fails', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    act(() => errorCb!(geoError(2, 'Position unavailable')));

    expect(result.current.error).toBe('Position unavailable');
    expect(result.current.mode).toBe('show');
    expect(clearWatch).not.toHaveBeenCalled();
  });

  it('FE-HOOK-GEO-006: falls back to a generic message when the error carries none', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    act(() => errorCb!(geoError(3, '')));
    expect(result.current.error).toBe('Location unavailable');
  });

  it('FE-HOOK-GEO-007: a permission denial stops tracking entirely', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    act(() => errorCb!(geoError(1, 'User denied Geolocation')));

    expect(result.current.mode).toBe('off');
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('FE-HOOK-GEO-008: refuses to start when the browser has no geolocation', async () => {
    // The hook guards with `'geolocation' in navigator`, so the key has to go
    // away entirely — a defined-but-undefined property would slip past it.
    delete (navigator as { geolocation?: Geolocation }).geolocation;
    const { result } = renderHook(() => useGeolocation());

    await act(() => result.current.cycleMode());

    expect(result.current.mode).toBe('off');
    expect(result.current.error).toBe('Geolocation is not supported in this browser');
  });

  it('FE-HOOK-GEO-009: prefers the webkit compass heading', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));

    act(() => orient({ webkitCompassHeading: 120, alpha: 10, absolute: true }));
    expect(result.current.position?.heading).toBe(120);
  });

  it('FE-HOOK-GEO-010: converts a counter-clockwise alpha into a clockwise heading', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));

    act(() => orient({ alpha: 90, absolute: true }));
    expect(result.current.position?.heading).toBe(270);
  });

  it('FE-HOOK-GEO-011: smooths successive headings instead of snapping', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));

    act(() => orient({ alpha: 0, absolute: true }));
    expect(result.current.position?.heading).toBe(0);

    // 0 → 40 with alpha 0.25 lands a quarter of the way, not at 40.
    act(() => orient({ alpha: 320, absolute: true }));
    expect(result.current.position?.heading).toBeCloseTo(10, 5);
  });

  it('FE-HOOK-GEO-012: takes the short way around the 360° seam', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));

    act(() => orient({ alpha: 10, absolute: true }));   // heading 350
    act(() => orient({ alpha: 350, absolute: true }));  // heading 10 — +20 across the seam
    expect(result.current.position?.heading).toBeCloseTo(355, 5);
  });

  it('FE-HOOK-GEO-013a: still uses a non-absolute alpha as a fallback heading', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));

    act(() => orient({ alpha: 90 }));
    expect(result.current.position?.heading).toBe(270);
  });

  it('FE-HOOK-GEO-013: ignores orientation events without a usable angle', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix({ heading: 45 })));

    act(() => orient({ alpha: null, absolute: true }));
    expect(result.current.position?.heading).toBe(45);
  });

  it('FE-HOOK-GEO-014: keeps the compass heading when the GPS fix has none', async () => {
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());
    act(() => successCb!(fix()));
    act(() => orient({ alpha: 180, absolute: true }));

    act(() => successCb!(fix({ heading: null }, 1_700_000_001_000)));
    expect(result.current.position?.heading).toBe(180);
  });

  it('FE-HOOK-GEO-015: setMode accepts a value and a derived updater', async () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.setMode('show'));
    expect(result.current.mode).toBe('show');
    expect(watchPosition).toHaveBeenCalledTimes(1);

    act(() => result.current.setMode(prev => (prev === 'show' ? 'follow' : prev)));
    expect(result.current.mode).toBe('follow');
    // Already watching — no second subscription.
    expect(watchPosition).toHaveBeenCalledTimes(1);

    act(() => result.current.setMode('off'));
    expect(result.current.mode).toBe('off');
    expect(result.current.position).toBeNull();
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('FE-HOOK-GEO-015b: the updater form sees the freshest mode and starts one watch', async () => {
    // The side effects run outside the state updater (React may invoke an
    // updater more than once per commit, and startWatch awaits the iOS
    // orientation prompt before it records the watch id), so the previous mode
    // comes from a ref that setMode keeps in step within a batch.
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('DeviceOrientationEvent', Object.assign(function () {}, { requestPermission }));

    const { result } = renderHook(() => useGeolocation(), { wrapper: StrictMode });

    await act(async () => {
      result.current.setMode('show');
      result.current.setMode(prev => (prev === 'show' ? 'follow' : 'off'));
      await Promise.resolve();
    });

    expect(result.current.mode).toBe('follow');
    expect(watchPosition).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-GEO-016: asks iOS for orientation permission and proceeds either way', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied');
    vi.stubGlobal('DeviceOrientationEvent', Object.assign(function () {}, { requestPermission }));

    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    expect(requestPermission).toHaveBeenCalled();
    expect(result.current.mode).toBe('show');
  });

  it('FE-HOOK-GEO-017: survives an older webkit that throws from requestPermission', async () => {
    const requestPermission = vi.fn().mockRejectedValue(new Error('not allowed'));
    vi.stubGlobal('DeviceOrientationEvent', Object.assign(function () {}, { requestPermission }));

    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    expect(result.current.mode).toBe('show');
    expect(watchPosition).toHaveBeenCalled();
  });

  it('FE-HOOK-GEO-018: tolerates clearWatch throwing while tearing down', async () => {
    clearWatch.mockImplementation(() => { throw new Error('gone'); });
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    expect(() => act(() => result.current.setMode('off'))).not.toThrow();
  });

  it('FE-HOOK-GEO-024: stopping while the iOS prompt is open leaves no watch behind', async () => {
    let grant!: () => void;
    const requestPermission = vi.fn(() => new Promise<string>(resolve => { grant = () => resolve('granted'); }));
    vi.stubGlobal('DeviceOrientationEvent', Object.assign(function () {}, { requestPermission }));

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.setMode('show'));
    act(() => result.current.setMode('off'));

    await act(async () => { grant(); await new Promise(r => setTimeout(r, 0)); });

    expect(watchPosition).not.toHaveBeenCalled();
  });

  it('FE-HOOK-GEO-025: stop and start during the iOS prompt still ends with one watch', async () => {
    const grants: ((v: string) => void)[] = [];
    const requestPermission = vi.fn(() => new Promise<string>(resolve => { grants.push(resolve); }));
    vi.stubGlobal('DeviceOrientationEvent', Object.assign(function () {}, { requestPermission }));

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.setMode('show'));
    act(() => result.current.setMode('off'));
    act(() => result.current.setMode('show'));

    await act(async () => { grants.forEach(g => g('granted')); await new Promise(r => setTimeout(r, 0)); });

    // Both runs got past the prompt; only the newer one may subscribe, or the older
    // watch keeps running with its id overwritten.
    expect(requestPermission).toHaveBeenCalledTimes(2);
    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBe('show');
  });

  it('FE-HOOK-GEO-019: stops the watch when the component unmounts', async () => {
    const { result, unmount } = renderHook(() => useGeolocation());
    await act(() => result.current.cycleMode());

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(7);
  });
});

describe('getCurrentPositionOnce', () => {
  /** Swaps the watch-based stub from beforeEach for a one-shot one. */
  function stubOnce(getCurrentPosition: (ok: PositionCallback, fail?: PositionErrorCallback) => void): void {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn(getCurrentPosition) },
      configurable: true,
    });
  }

  it('FE-HOOK-GEO-020: resolves a mapped position from a single fix', async () => {
    stubOnce(ok => ok(fix({ latitude: 41.9, longitude: 12.5, accuracy: 10 })));

    await expect(getCurrentPositionOnce()).resolves.toEqual({
      lat: 41.9, lng: 12.5, accuracy: 10, heading: null, speed: null, timestamp: 1_700_000_000_000,
    });
  });

  it('FE-HOOK-GEO-021: rejects as unsupported when the browser has no geolocation', async () => {
    // Same guard as FE-HOOK-GEO-008: the key has to go away entirely.
    delete (navigator as { geolocation?: Geolocation }).geolocation;

    await expect(getCurrentPositionOnce()).rejects.toMatchObject({
      name: 'GeoOnceError',
      code: 'unsupported',
    });
  });

  it('FE-HOOK-GEO-022: rejects outside a secure context without asking the browser', async () => {
    const getCurrentPosition = vi.fn();
    stubOnce(getCurrentPosition);
    vi.stubGlobal('isSecureContext', false);

    await expect(getCurrentPositionOnce()).rejects.toMatchObject({ code: 'insecure-context' });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it.each([
    [1, 'permission-denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('FE-HOOK-GEO-023: maps error code %i to "%s"', async (code, expected) => {
    stubOnce((_ok, fail) => fail?.(geoError(code)));

    const rejection = await getCurrentPositionOnce().catch((e: unknown) => e);
    expect(rejection).toBeInstanceOf(GeoOnceError);
    expect((rejection as GeoOnceError).code).toBe(expected);
  });
});
