import type { PushSubscriptionInput } from '@trek/shared';
import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';

/**
 * Push inside the app: the same Web Push subscription a browser makes, only
 * the app makes it (TrekShell.registerPush). Its endpoint is liketrek's relay
 * for this device's APNs or FCM token and its keys live on the device, so the
 * server encrypts exactly as for a browser and the relay hands on ciphertext
 * that the app decrypts (iOS: the notification extension, Android:
 * TrekPushService). push/webPush.ts takes this path
 * wherever the binary reports the nativePush feature; the settings card, the
 * test push and the logout teardown stay what they are.
 *
 * The endpoint is remembered on the device, the way a browser remembers its
 * subscription, so the card can say on or off and the logout can name it.
 */
const KEY = 'trek.nativePushEndpoint';

export function nativePushActive(): boolean {
  return isNativeApp() && hasNativeFeature('nativePush');
}

export function nativePushEndpoint(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function rememberEndpoint(endpoint: string | null): void {
  try {
    if (endpoint) window.localStorage.setItem(KEY, endpoint);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage refused: the card then reads off and offers to switch it on again.
  }
}

export class NativePushDenied extends Error {}

/** Permission, APNs and the device keys, as a subscription the server can store. */
export async function registerNativePush(): Promise<PushSubscriptionInput> {
  try {
    const subscription = await TrekShell.registerPush();
    rememberEndpoint(subscription.endpoint);
    return subscription;
  } catch (err) {
    if ((err as { code?: string } | null)?.code === 'DENIED') throw new NativePushDenied();
    throw err;
  }
}

export function forgetNativePush(): void {
  rememberEndpoint(null);
}

/** Opens the place a tapped notification points at, inside the app's own routing. */
export function openPushTarget(url: string): void {
  let target: URL;
  try {
    target = new URL(url, window.location.origin);
  } catch {
    return;
  }
  // Only this server's pages: a notification never navigates the app elsewhere.
  if (target.origin !== window.location.origin) return;
  window.history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Follows taps on notifications, including the one the app was opened from. */
export async function startNativePush(): Promise<void> {
  if (!nativePushActive()) return;
  void TrekShell.addListener('pushOpened', ({ url }) => openPushTarget(url));
  try {
    const { url } = await TrekShell.takeOpenedPush();
    if (url) openPushTarget(url);
  } catch (err) {
    reportNativeFailure(err);
  }
}
