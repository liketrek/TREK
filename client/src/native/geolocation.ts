import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, type NativeLocationPayload } from './trekShell';

/**
 * navigator.geolocation, answered by the app's own location stream where the
 * binary has the geolocation feature: CoreLocation on iOS, the system's fused
 * provider on Android.
 *
 * WKWebView asks for the location per server origin, under the server's name,
 * and asks again across launches. The app asks once, as the app. Installing the
 * shim over navigator.geolocation keeps every caller as it is (the locate
 * button, the tour tracking, the nearby search): one code path, the browser's
 * API, with the app underneath.
 */
type Success = PositionCallback;
type Failure = PositionErrorCallback | null | undefined;

interface Watcher {
  success: Success;
  failure: Failure;
  once: boolean;
  high: boolean;
}

const watchers = new Map<number, Watcher>();
let nextId = 1;
let running = false;
/** The accuracy the running stream was started with. */
let runningHigh = false;
let subscribed: Promise<unknown> | null = null;

function toPosition(p: Extract<NativeLocationPayload, { latitude: number }>): GeolocationPosition {
  const coords = {
    latitude: p.latitude,
    longitude: p.longitude,
    accuracy: p.accuracy,
    altitude: p.altitude,
    altitudeAccuracy: null,
    heading: p.heading,
    speed: p.speed,
    toJSON() {
      return { ...this };
    },
  };
  return { coords, timestamp: p.timestamp, toJSON: () => ({ coords, timestamp: p.timestamp }) } as GeolocationPosition;
}

function toError(e: { code: number; message: string }): GeolocationPositionError {
  return {
    code: e.code,
    message: e.message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

function dispatch(payload: NativeLocationPayload): void {
  for (const [id, w] of [...watchers]) {
    if (payload.error) w.failure?.(toError(payload.error));
    else w.success(toPosition(payload as Extract<NativeLocationPayload, { latitude: number }>));
    if (w.once) watchers.delete(id);
  }
  syncStream();
}

/**
 * Runs the native stream while anyone listens, at the accuracy the most
 * demanding of them asked for: high while a watcher wants it (tour tracking),
 * back to the battery-friendly one once that watcher is gone.
 */
function syncStream(): void {
  const high = [...watchers.values()].some((w) => w.high);
  if (watchers.size > 0 && (!running || high !== runningHigh)) {
    running = true;
    runningHigh = high;
    subscribed ??= TrekShell.addListener('location', dispatch);
    TrekShell.startLocation({ highAccuracy: high }).catch(reportNativeFailure);
  } else if (watchers.size === 0 && running) {
    running = false;
    runningHigh = false;
    TrekShell.stopLocation().catch(reportNativeFailure);
  }
}

function add(success: Success, failure: Failure, options: PositionOptions | undefined, once: boolean): number {
  const id = nextId++;
  watchers.set(id, { success, failure, once, high: options?.enableHighAccuracy === true });
  syncStream();
  return id;
}

/** Puts the app's location under navigator.geolocation. Once, inside a binary that has it. */
export function installNativeGeolocation(): boolean {
  if (!isNativeApp() || !hasNativeFeature('geolocation') || typeof navigator === 'undefined') return false;
  const shim: Geolocation = {
    getCurrentPosition: (success, failure, options) => {
      add(success, failure, options, true);
    },
    watchPosition: (success, failure, options) => add(success, failure, options, false),
    clearWatch: (id) => {
      watchers.delete(id);
      syncStream();
    },
  };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: shim });
  return true;
}

/** Test helper. */
export function _resetNativeGeolocation(): void {
  watchers.clear();
  running = false;
  runningHigh = false;
  subscribed = null;
  nextId = 1;
}
