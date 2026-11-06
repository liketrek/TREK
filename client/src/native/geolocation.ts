import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, type NativeLocationPayload } from './trekShell';

/**
 * navigator.geolocation, answered by the iOS app's CoreLocation where the binary
 * has the geolocation feature.
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
}

const watchers = new Map<number, Watcher>();
let nextId = 1;
let running = false;
let highAccuracy = false;
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
    else w.success(toPosition(payload));
    if (w.once) watchers.delete(id);
  }
  syncStream();
}

/** Runs the native stream while anyone listens, at the accuracy the most demanding asked for. */
function syncStream(): void {
  if (watchers.size > 0 && !running) {
    running = true;
    subscribed ??= TrekShell.addListener('location', dispatch);
    TrekShell.startLocation({ highAccuracy }).catch(reportNativeFailure);
  } else if (watchers.size === 0 && running) {
    running = false;
    TrekShell.stopLocation().catch(reportNativeFailure);
  }
}

function add(success: Success, failure: Failure, options: PositionOptions | undefined, once: boolean): number {
  if (options?.enableHighAccuracy) highAccuracy = true;
  const id = nextId++;
  watchers.set(id, { success, failure, once });
  syncStream();
  return id;
}

/** Puts the app's location under navigator.geolocation. Once, inside a binary that has it. */
export function installNativeGeolocation(): boolean {
  if (!isNativeIos() || !hasNativeFeature('geolocation') || typeof navigator === 'undefined') return false;
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
  highAccuracy = false;
  subscribed = null;
  nextId = 1;
}
