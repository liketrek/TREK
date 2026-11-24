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
  /**
   * `previousUrl`: the server this app remembered before an update asked for a
   * newer one (SERVER_CHECK in TrekServerStore). Set only while no server is,
   * so the address screen can check it again, pre-filled.
   */
  /**
   * The server picked, the one before an update asked to check it again, and
   * why its page did not load last time (taken once; builds before 5.1.4 leave
   * it out).
   */
  getServer(): Promise<{ url: string | null; previousUrl?: string | null; failure?: string | null }>;
  /**
   * Remembers the server and loads it. The current page is gone afterwards.
   * `signInHosts` are the hosts of a proxy's sign-in page in front of it
   * (authGate.ts): only they may load in the web view besides the server.
   * `welcome` is the one-time code of a TREK Cloud purchase: the first load
   * opens the server's welcome page with it, which signs the buyer in. A build
   * without this option ignores it and opens the server as usual.
   * `labels` are the words of the bar the app shows over a proxy's sign-in page,
   * or over an error page in place of the server's (a proxy's block page), in the
   * user's language: the server's UI is not there to say them.
   */
  setServer(options: {
    url: string;
    signInHosts?: string[];
    welcome?: string;
    labels?: { signInHint: string; changeServer: string; errorPageHint?: string };
  }): Promise<void>;
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
  /**
   * Android: a return to the sign-in scheme that found no authenticate() call
   * waiting, because the app was started anew meanwhile. Handed out once, and
   * only for two minutes, as long as the server keeps its code. Not in iOS builds, nor in Android builds before 5.1.4.
   */
  takeAuthCallback(): Promise<{ url: string | null }>;
  /**
   * Stores the server's start page for a start without the server. Android
   * also downloads the build's `files` the copy does not hold yet (an Android
   * build before the offline copy resolves `saved: false`); iOS keeps those in
   * WebKit's HTTP cache instead and ignores them.
   */
  refreshOfflineCopy(options?: { files?: string[] }): Promise<{ saved: boolean; complete?: boolean }>;
  /** Starts on that copy under the server's origin. False when there is none. */
  openOfflineCopy(): Promise<{ opened: boolean }>;
  /** What this binary offers the UI (native/capabilities.ts). Missing before shell API 2. */
  getCapabilities(): Promise<NativeCapabilities>;
  /** Feature tileCache: what the map tile store takes on disk, and its limit (iOS: every map; Android: Mapbox's). */
  getTileCacheUsage(): Promise<{ bytes: number; limit: number }>;
  /** Feature tileCache: empties the map tile store. */
  clearTileCache(): Promise<void>;
  /** Feature biometricLock: which biometry the device offers for the app lock. */
  biometryInfo(): Promise<{ available: boolean; type: string }>;
  /** Feature biometricLock: Face ID, Touch ID or the passcode. Rejects with CANCELLED or FAILED. */
  authenticateBiometric(options: { reason: string }): Promise<{ ok: true }>;
  /** Feature biometricLock: a blurred cover in the app switcher while the lock is on. */
  setPrivacyCover(options: { enabled: boolean }): Promise<void>;
  /** Feature geolocation: starts the native location stream (the "location" event). */
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
    /** Android: minutes after midnight of the next stop, for the countdown in the Live Update. */
    nextMinutes?: number;
    /** Android: each stop's colour (#rrggbb) for the Live Update's segments. */
    colors?: (string | null)[];
    /** iOS: the day's flight near or in the air, drawn as a boarding pass; older binaries ignore it. */
    flight?: {
      number: string;
      from: string;
      to: string;
      dep: number;
      arr: number;
      depTime: string;
      arrTime: string;
      delay?: number;
      airborne?: boolean;
    };
  }): Promise<{ running: boolean }>;
  endTripDay(): Promise<void>;
  /** Feature storeKit (iOS) or playBilling (Android): the store's price strings for the products it knows. */
  storeProducts(options: {
    ids: string[];
  }): Promise<{ products: { id: string; displayPrice: string }[]; sandbox?: boolean }>;
  /**
   * The purchase sheet. Set when bought: on iOS `jws`, the signed transaction; on
   * Android `purchaseToken`, which the control plane verifies with Google Play.
   */
  storePurchase(options: { productId: string }): Promise<{
    /** `subscribed`: this store account already holds a delivered subscription, so nothing was bought. */
    kind: 'bought' | 'cancelled' | 'pending' | 'failed' | 'subscribed';
    jws?: string;
    purchaseToken?: string;
    productId?: string;
    transactionId?: string;
  }>;
  /** Marks a purchase delivered once its instance exists (Android: acknowledges it with Google Play). */
  storeFinish(options: { transactionId: string }): Promise<void>;
  /** iOS, feature wallet: adds a .pkpass (base64) to Apple Wallet, or opens it there when it is already in. */
  addToWallet(options: { data: string }): Promise<{ result: 'added' | 'opened' | 'cancelled' }>;
  /**
   * Shows a file written to the app's cache (a file:// path) in the system's
   * viewer: Quick Look on iOS, the app that views the type on Android. Feature
   * "filePreview"; "unsupported" where nothing on the device shows the type.
   */
  previewFile(options: {
    path: string;
    mimeType: string;
    title?: string;
  }): Promise<{ result: 'shown' | 'unsupported' }>;
  /** iOS, feature storeKit: the newest active subscription under `prefix` on this Apple ID, if any. */
  storeRestore(options: { prefix: string }): Promise<{ jws?: string; transactionId?: string }>;
  /**
   * Whether this Apple ID or Google account holds a delivered subscription under
   * `prefix`, read without asking for a password. Not in builds before 5.1.4.
   */
  storeHeld(options: { prefix: string }): Promise<{ held: boolean }>;
  /** Feature watch: what the Apple Watch app shows (native/watch.ts), as JSON, sent on through WatchConnectivity. */
  setWatchSnapshot(options: { json: string }): Promise<void>;
  /** Feature watch: the ticks the watch sent since the last call, oldest first (parsed by parseWatchActions). */
  takeWatchActions(): Promise<{ actions: unknown[] }>;
  /** Feature watch: the watch sent a tick; takeWatchActions has it. */
  addListener(event: 'watchAction', listener: () => void): Promise<{ remove: () => Promise<void> }>;
  addListener(
    event: 'pushOpened',
    listener: (payload: { url: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  /** Android, feature googleWallet: opens a Google Wallet save link (https://pay.google.com/gp/v/save/...). */
  addToGoogleWallet(options: { url: string }): Promise<{ result: 'opened' }>;
  /** Android, feature windowLayout: the window's size classes and a foldable's posture and hinge. */
  getWindowLayout(): Promise<NativeWindowLayout>;
  /**
   * Feature clientCertificate: a GET against the user's server for the address
   * screen, made natively. It shows the stored client certificate to that server
   * when asked and reports whether the server asked (`certRequested`) and got
   * one (`certSent`). A failed connection resolves with status 0.
   */
  requestServer(options: { url: string; timeoutMs?: number }): Promise<NativeServerResponse>;
  /**
   * Feature clientCertificate: the stored client certificate, or null, and the
   * last server that asked for one while the app ran (`served`: it got one).
   */
  clientCertificate(): Promise<{
    certificate: ClientCertificateInfo | null;
    request?: { host: string; port: number; served: boolean };
  }>;
  /**
   * Feature clientCertificate: picks a .p12/.pfx file, asks for its password
   * (with `labels`, the UI's words) until it opens, and keeps it for the server
   * at host and port, replacing any other.
   */
  importClientCertificate(options: {
    host: string;
    port: number;
    labels: ClientCertificateLabels;
  }): Promise<ClientCertificateImport>;
  /** Feature clientCertificate: forgets the stored client certificate. */
  removeClientCertificate(): Promise<void>;
  addListener(
    event: 'windowLayout',
    listener: (payload: NativeWindowLayout) => void
  ): Promise<{ remove: () => Promise<void> }>;
  /** Android, feature playBilling: a paid subscription never delivered (cleared while the app was closed). */
  storeUnfinished(options: { prefix: string }): Promise<StoreRestoreResult>;
  /** Android, feature playBilling: a pending payment cleared while the app runs. */
  addListener(
    event: 'storeTransaction',
    listener: (payload: StoreRestoreResult) => void
  ): Promise<{ remove: () => Promise<void> }>;
  /**
   * Feature keyCommands (iOS, Android): the shortcuts a hardware keyboard has right now,
   * with their names in the UI's language. The app lists them in the overlay a
   * held Command key shows and in the iPadOS menu bar, Android in its
   * keyboard shortcuts list.
   */
  setKeyCommands(options: { commands: NativeKeyCommand[] }): Promise<void>;
  /** Feature keyCommands: one of those shortcuts was pressed. */
  addListener(
    event: 'keyCommand',
    listener: (payload: { id: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  /** Feature quickActions (iOS): the actions a long press on the app icon shows, in the UI's language. */
  setQuickActions(options: { items: NativeQuickAction[] }): Promise<void>;
  /**
   * Feature quickActions: the action the app was launched with, before the UI ran.
   * With the feature appLinks also a widget or Live Activity tap, as its path.
   */
  takeQuickAction(): Promise<{ path: string | null }>;
  /** Feature quickActions: an action chosen (with appLinks: a widget tapped) while the app was running. */
  addListener(
    event: 'quickAction',
    listener: (payload: { path: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

/** One quick action on the app icon: what it says, and the path in the UI it opens. */
export interface NativeQuickAction {
  /** Stable name, e.g. "newTrip". */
  type: string;
  title: string;
  subtitle?: string;
  /** 'add' or 'trip'. */
  icon: 'add' | 'trip';
  /** A path of this server's UI, starting with "/". */
  path: string;
}

/** What Google Play Billing answers a restore with (Android, feature playBilling), beside iOS's `jws`. */
export interface StoreRestoreResult {
  jws?: string;
  purchaseToken?: string;
  productId?: string;
  transactionId?: string;
}

/** A keyboard shortcut as the app registers it (UIKeyCommand on iOS, a KeyboardShortcutInfo on Android). */
export interface NativeKeyCommand {
  id: string;
  title: string;
  /** The key: a character, or one of 'left', 'right', 'up', 'down', 'escape'. */
  input: string;
  /** Any of 'command', 'shift', 'option', 'control'. */
  modifiers: string[];
}

/** A document shared to TREK, as the native side reads it. */
export interface SharedFilePayload {
  name: string;
  mimeType: string;
  /** base64 */
  data: string;
  /** Set when the share sheet already asked which trip it belongs to (feature shareSheet). */
  tripId?: number;
  /** The http(s) address of a shared page or link, which can go to the trip's links instead. */
  url?: string;
  /** The page's title, for that link. */
  title?: string;
}

/**
 * The window as the Android app sees it (feature windowLayout): its size in CSS
 * pixels, Android's size classes, and a foldable's posture with the hinge's
 * place in the window. `posture` is none on a device without a fold.
 */
export interface NativeWindowLayout {
  width: number;
  height: number;
  widthClass: 'compact' | 'medium' | 'expanded';
  heightClass: 'compact' | 'medium' | 'expanded';
  posture: 'none' | 'flat' | 'halfOpened';
  orientation?: 'vertical' | 'horizontal';
  separating?: boolean;
  occluding?: boolean;
  /** The fold's rectangle on the screen, in CSS pixels: geometry, not text sides. */
  hinge?: Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>;
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

interface NativeServerResponse {
  status: number;
  data: unknown;
  url: string;
  headers?: Record<string, string>;
  certRequested: boolean;
  certSent: boolean;
  /** host:port of the server that asked. */
  certHost?: string;
  /** Why the connection failed, when status is 0. */
  error?: string;
}

export interface ClientCertificateInfo {
  host: string;
  port: number;
  /** The certificate's common name. */
  subject: string;
  /** The issuer's common name. */
  issuer: string;
  /** Expiry, in milliseconds since 1970. */
  notAfter: number;
}

export interface ClientCertificateLabels {
  title: string;
  message: string;
  placeholder: string;
  ok: string;
  cancel: string;
  wrongPassword: string;
}

export type ClientCertificateFailure = 'format' | 'no_key' | 'expired' | 'not_yet_valid' | 'store';

export interface ClientCertificateImport {
  result: 'imported' | 'cancelled' | 'failed';
  failure?: ClientCertificateFailure;
  certificate?: ClientCertificateInfo;
}

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
