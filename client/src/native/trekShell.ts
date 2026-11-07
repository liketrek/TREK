import { registerPlugin } from '@capacitor/core';
import type { NativeCapabilities } from './capabilities';

/**
 * The app's own native plugin, implemented in
 * ios/App/App/TrekShellPlugin.swift and
 * android/app/src/main/java/com/liketrek/trek/TrekShellPlugin.java.
 *
 * The app is a frame around the UI the user's server delivers, so what the
 * web side needs from it is small: which server that is, a way to change it,
 * a system browser for the sign-ins a WebView cannot do, and on iOS the
 * offline copy of the start page that stands in for the missing service
 * worker.
 */
export interface TrekShellPlugin {
  getServer(): Promise<{ url: string | null }>;
  /** Remembers the server and loads it. The current page is gone afterwards. */
  setServer(options: { url: string }): Promise<void>;
  /** Forgets the server and returns to the address screen. */
  resetServer(): Promise<void>;
  /** Loads the remembered server again, after it could not be reached. */
  reload(): Promise<void>;
  /**
   * Opens `url` in the system browser and resolves with the URL it was sent
   * back to under `callbackScheme`. Rejects with code `CANCELLED` when the
   * user closes the browser.
   */
  authenticate(options: { url: string; callbackScheme: string }): Promise<{ url: string }>;
  /** iOS: stores the server's start page for a cold start without network. */
  refreshOfflineCopy(): Promise<{ saved: boolean }>;
  /** iOS: loads that copy under the server's origin. False when there is none. */
  openOfflineCopy(): Promise<{ opened: boolean }>;
  /** What this binary offers the UI (native/capabilities.ts). Missing before shell API 2. */
  getCapabilities(): Promise<NativeCapabilities>;
  /** iOS, feature tileCache: what the map tile store takes on disk, and its limit. */
  getTileCacheUsage(): Promise<{ bytes: number; limit: number }>;
  /** iOS, feature tileCache: empties the map tile store. */
  clearTileCache(): Promise<void>;
  /** Feature biometricLock: which biometry the device offers for the app lock. */
  biometryInfo(): Promise<{ available: boolean; type: string }>;
  /** Feature biometricLock: Face ID, Touch ID or the passcode. Rejects with CANCELLED or FAILED. */
  authenticateBiometric(options: { reason: string }): Promise<{ ok: true }>;
  /** Feature biometricLock: a blurred cover in the app switcher while the lock is on. */
  setPrivacyCover(options: { enabled: boolean }): Promise<void>;
  /** iOS, feature geolocation: starts the native location stream (the "location" event). */
  startLocation(options: { highAccuracy: boolean }): Promise<void>;
  stopLocation(): Promise<void>;
  addListener(
    event: 'location',
    listener: (payload: NativeLocationPayload) => void
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    event: 'sharedFile',
    listener: (payload: SharedFilePayload) => void
  ): Promise<{ remove: () => Promise<void> }>;
  /** Feature sharedFiles: the booking document shared to TREK before the UI ran. */
  takeSharedFile(): Promise<{ file: SharedFilePayload | null }>;
  /** Feature nativePush: permission, APNs and the device keys, as a Web Push subscription. Rejects with DENIED. */
  registerPush(): Promise<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
  /** Feature nativePush: the notification the app was opened from, before the UI ran. */
  takeOpenedPush(): Promise<{ url: string | null }>;
  /** Feature widgets: what the home-screen widget shows (native/widgets.ts), as JSON. */
  /** Feature widgetTrips adds `key`: "trip.<id>" for one trip's snapshot, "trips" for the list a widget picks from. */
  setWidgetSnapshot(options: { json: string; key?: string }): Promise<void>;
  /** Feature liveActivity: starts the travel day's Live Activity, or updates the running one. */
  syncTripDay(options: {
    tripTitle: string;
    path: string;
    dayLabel: string;
    nextName: string;
    nextTime?: string;
    done: number;
    total: number;
  }): Promise<{ running: boolean }>;
  endTripDay(): Promise<void>;
  /** iOS, feature storeKit: the App Store's price strings for the products it knows. */
  storeProducts(options: { ids: string[] }): Promise<{ products: { id: string; displayPrice: string }[] }>;
  /** iOS, feature storeKit: the purchase sheet; `jws` is the signed transaction, set when bought. */
  storePurchase(options: {
    productId: string;
  }): Promise<{ kind: 'bought' | 'cancelled' | 'pending' | 'failed'; jws?: string; transactionId?: string }>;
  /** iOS, feature storeKit: marks a purchase delivered once its instance exists. */
  storeFinish(options: { transactionId: string }): Promise<void>;
  /** iOS, feature storeKit: the newest active subscription under `prefix` on this Apple ID, if any. */
  storeRestore(options: { prefix: string }): Promise<{ jws?: string; transactionId?: string }>;
  addListener(
    event: 'pushOpened',
    listener: (payload: { url: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

/** A document shared to TREK, as the native side reads it. */
export interface SharedFilePayload {
  name: string;
  mimeType: string;
  /** base64 */
  data: string;
  /** Set when the share sheet already asked which trip it belongs to (feature shareSheet). */
  tripId?: number;
}

/** A position, or an error shaped like GeolocationPositionError (1 denied, 2 unavailable). */
export type NativeLocationPayload =
  | {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude: number | null;
      speed: number | null;
      heading: number | null;
      timestamp: number;
      error?: undefined;
    }
  | { error: { code: number; message: string } };

export const TrekShell = registerPlugin<TrekShellPlugin>('TrekShell');

export const APP_URL_SCHEME = 'com.liketrek.trek';

/**
 * True for the rejection Capacitor gives when the installed app has no such
 * native method: the UI comes from the server, so a newer server can call into
 * an app binary that predates the method.
 */
export function isUnimplemented(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'UNIMPLEMENTED';
}
