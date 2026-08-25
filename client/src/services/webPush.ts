import { webPushSubscriptionSchema, type WebPushCurrentResult, type WebPushSubscription } from '@trek/shared';

import { notificationsApi } from '../api/client';

const INSTALLATION_KEY = 'trek_web_push_installation_id';
const ENABLED_KEY = 'trek_web_push_enabled';
const PUSH_STATE_DB = 'trek-push-state';
const PUSH_STATE_STORE = 'state';

export type WebPushCapability = 'supported' | 'unsupported' | 'denied' | 'ios-install-required';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export function getWebPushInstallationId(): string {
  const existing = localStorage.getItem(INSTALLATION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(INSTALLATION_KEY, id);
  return id;
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function detectWebPushCapability(): WebPushCapability {
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  if (isIOS && !isStandalone()) return 'ios-install-required';
  if (
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  return 'supported';
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function deviceLabel(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /CriOS|Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const platform = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'device';
  return `${browser} on ${platform}`;
}

function subscriptionJson(subscription: PushSubscription): WebPushSubscription {
  return webPushSubscriptionSchema.parse(subscription.toJSON());
}

function subscriptionUsesKey(subscription: PushSubscription, publicKey: string): boolean {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  const actual = new Uint8Array(current);
  const expected = base64UrlToUint8Array(publicKey);
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

async function ensureSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription> {
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !subscriptionUsesKey(subscription, publicKey)) {
    await subscription.unsubscribe().catch(() => false);
    subscription = null;
  }
  return (
    subscription ??
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    })
  );
}

async function readyRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

export async function enableWebPush(): Promise<WebPushCurrentResult> {
  const capability = detectWebPushCapability();
  if (capability !== 'supported') throw new Error(capability);

  const config = await notificationsApi.webPushConfig();
  if (!config.enabled) throw new Error('Web Push is disabled by the administrator');
  if (!config.available || !config.publicKey) throw new Error(config.error || 'Web Push is unavailable');

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'denied' : 'permission-dismissed');

  const registration = await readyRegistration();
  const subscription = await ensureSubscription(registration, config.publicKey);
  const result = await notificationsApi.webPushCurrent({
    intent: 'enable',
    installationId: getWebPushInstallationId(),
    label: deviceLabel(),
    subscription: subscriptionJson(subscription),
  });
  if (result.state === 'active') localStorage.setItem(ENABLED_KEY, '1');
  return result;
}

export async function reconcileWebPush(): Promise<WebPushCurrentResult | null> {
  if (detectWebPushCapability() !== 'supported' || Notification.permission !== 'granted') return null;
  if (localStorage.getItem(ENABLED_KEY) !== '1') return null;
  const config = await notificationsApi.webPushConfig();
  if (!config.available || !config.publicKey) return null;
  const registration = await readyRegistration();
  const subscription = await ensureSubscription(registration, config.publicKey);
  const result = await notificationsApi.webPushCurrent({
    intent: 'reconcile',
    installationId: getWebPushInstallationId(),
    label: deviceLabel(),
    subscription: subscriptionJson(subscription),
  });
  if (result.state === 'revoked') {
    await subscription.unsubscribe().catch(() => false);
    localStorage.removeItem(ENABLED_KEY);
  }
  return result;
}

export async function disableCurrentWebPush(): Promise<void> {
  const installationId = getWebPushInstallationId();
  try {
    const { devices } = await notificationsApi.webPushDevices();
    const current = devices.find((device) => device.installationId === installationId);
    if (current) await notificationsApi.revokeWebPushDevice(current.id);
  } catch {
    // Local unsubscribe still runs so a failed logout request cannot leave this
    // browser registered with the push service indefinitely.
  }
  try {
    const registration = await readyRegistration();
    const subscription = await registration.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // Browser push state is best-effort during logout.
  }
  localStorage.removeItem(ENABLED_KEY);
}

function openPushStateDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PUSH_STATE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PUSH_STATE_STORE))
        request.result.createObjectStore(PUSH_STATE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setActivePushUser(userId: number | null): Promise<void> {
  try {
    const stateDb = await openPushStateDb();
    await new Promise<void>((resolve, reject) => {
      const tx = stateDb.transaction(PUSH_STATE_STORE, 'readwrite');
      const store = tx.objectStore(PUSH_STATE_STORE);
      if (userId == null) store.delete('activeUserId');
      else store.put(userId, 'activeUserId');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    stateDb.close();
  } catch {
    // Missing/blocked IndexedDB makes the worker use its private generic preview.
  }
}

export async function updateAppBadge(count: number): Promise<void> {
  try {
    if (count > 0 && 'setAppBadge' in navigator) await navigator.setAppBadge(count);
    else if ('clearAppBadge' in navigator) await navigator.clearAppBadge();
  } catch {
    // The Badging API is optional and may be denied independently of notifications.
  }
}
