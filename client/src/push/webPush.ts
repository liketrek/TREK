import type { PushSubscriptionInput, PushUnsubscribeRequest } from '@trek/shared'
import { pushApi } from '../api/push'
import { isEffectivelyOffline } from '../sync/networkMode'
import { isIosDevice, isIosStandalone } from '../utils/iosDevice'

/**
 * Web Push on this device: whether it can work here, and switching it on and
 * off.
 *
 * Deliberately online only, and deliberately without a mirror. The browser's
 * push subscription is the one record of "this device receives push"; the
 * server keeps its copy keyed by the subscription's endpoint, and nothing in
 * Zustand or Dexie repeats either. Making a subscription needs the browser's
 * push service and the server at the same moment, so an offline queue would
 * have nothing to replay, and a cached copy could only ever disagree with the
 * browser.
 *
 * React-free on purpose: the settings cards (through `useWebPush`), the auth
 * store (logout and the re-sync after sign-in) and the tests all drive these
 * same functions.
 */

export type WebPushUnsupportedReason = 'insecure' | 'unsupported' | 'ios-install'

/** `reason` is null exactly when `supported` is true. */
export interface WebPushSupport {
  supported: boolean
  reason: WebPushUnsupportedReason | null
}

/** What the settings card has to say about this device. */
export type WebPushDeviceState = WebPushUnsupportedReason | 'denied' | 'off' | 'on'

export type WebPushErrorCode = 'denied' | 'dismissed' | 'failed'

/** Why switching push on did not work: blocked, the prompt closed without an answer, or anything else. */
export class WebPushError extends Error {
  readonly code: WebPushErrorCode
  readonly reason: unknown

  constructor(code: WebPushErrorCode, reason?: unknown) {
    super(`Web Push: ${code}`)
    this.name = 'WebPushError'
    this.code = code
    this.reason = reason
  }
}

/**
 * How long switching push on waits for the service worker. `registerSW.js`
 * installs it on page load, so this only runs out on a page that never got
 * one, and there the card should say so rather than spin.
 */
export const REGISTRATION_TIMEOUT_MS = 10_000

/** Logout waits at most this long for this device to be forgotten. It must never hang on it. */
export const LOGOUT_PUSH_TIMEOUT_MS = 3_000

function hasPushApis(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Whether push can work in this browser, and if not, the reason the user can
 * do something about.
 */
export function getWebPushSupport(): WebPushSupport {
  if (typeof window === 'undefined') return unsupported('unsupported')
  // A service worker, and push with it, exists only in a secure context: HTTPS,
  // or localhost while developing. A plain http LAN address never gets one.
  if (window.isSecureContext === false) return unsupported('insecure')
  // iOS and iPadOS deliver push only to TREK added to the Home Screen. In a
  // Safari tab the APIs are simply missing, which would read as "this browser
  // cannot" when the fix is one tap in the share menu.
  if (isIosDevice() && !isIosStandalone()) return unsupported('ios-install')
  if (!hasPushApis()) return unsupported('unsupported')
  return { supported: true, reason: null }
}

function unsupported(reason: WebPushUnsupportedReason): WebPushSupport {
  return { supported: false, reason }
}

/** The notification permission as the browser holds it right now. */
export function getPushPermission(): NotificationPermission {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
}

/** The applicationServerKey the browser wants: the raw bytes behind the server's base64url string. */
export function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), ch => ch.codePointAt(0) ?? 0)
}

/** A key the browser reports it subscribed with, compared with the server's. Unknown counts as the same. */
function keyMatches(subscribedWith: ArrayBuffer | null | undefined, serverKey: Uint8Array): boolean {
  if (!subscribedWith) return true
  const bytes = new Uint8Array(subscribedWith)
  return bytes.length === serverKey.length && bytes.every((byte, i) => byte === serverKey[i])
}

/** What `PushSubscription.toJSON()` hands over, in the shape of the shared contract. */
export function toSubscriptionInput(subscription: PushSubscription): PushSubscriptionInput {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!json.endpoint || !p256dh || !auth) throw new WebPushError('failed', 'subscription without keys')
  return { endpoint: json.endpoint, expirationTime: json.expirationTime ?? null, keys: { p256dh, auth } }
}

/** Settles with `fallback` once `ms` have passed, unless `promise` settled first. */
function withTimeout<T, F>(promise: Promise<T>, ms: number, fallback: F): Promise<T | F> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<F>(resolve => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * A step whose failure changes nothing for the caller. It still gets a line in
 * the console, because "push quietly stopped" is otherwise impossible to trace.
 */
async function bestEffort<T>(what: string, step: () => Promise<T>): Promise<T | undefined> {
  try {
    return await step()
  } catch (err) {
    console.warn(`[push] ${what} failed`, err)
    return undefined
  }
}

/**
 * The registration already in charge of this origin, or null. It neither waits
 * for one to appear nor calls update(): the version handover owns updates, and
 * its tests count every call.
 */
async function existingRegistration(): Promise<ServiceWorkerRegistration | null> {
  const container = navigator.serviceWorker
  if (!container || typeof container.getRegistration !== 'function') return null
  return (await container.getRegistration()) ?? null
}

/** This device's subscription, or null when it has none or cannot have one. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!hasPushApis()) return null
  const registration = await existingRegistration()
  if (!registration?.pushManager) return null
  return registration.pushManager.getSubscription()
}

/**
 * The active registration, for subscribing. `ready` never settles on a page
 * without a service worker, hence the timeout.
 */
export async function waitForPushRegistration(
  timeoutMs = REGISTRATION_TIMEOUT_MS,
): Promise<ServiceWorkerRegistration | null> {
  if (!hasPushApis()) return null
  return withTimeout(navigator.serviceWorker.ready, timeoutMs, null)
}

/** The server's public key, or null when it could not be fetched now. Never rejects. */
export async function loadPushPublicKey(): Promise<string | null> {
  const result = await bestEffort('loading the public key', () => pushApi.getPublicKey())
  return result?.publicKey || null
}

/** What the settings card shows for this device. Never rejects. */
export async function readWebPushDeviceState(): Promise<WebPushDeviceState> {
  const { reason } = getWebPushSupport()
  if (reason) return reason
  if (getPushPermission() === 'denied') return 'denied'
  const subscription = await bestEffort('reading the subscription', () => currentPushSubscription())
  return subscription ? 'on' : 'off'
}

/** Both halves of dropping a subscription, each best effort: the server's row and the browser's own. */
async function forgetSubscription(subscription: PushSubscription): Promise<void> {
  await bestEffort('forgetting the device on the server', () => pushApi.unsubscribe(subscription.endpoint))
  await bestEffort('unsubscribing in the browser', () => subscription.unsubscribe())
}

async function subscribeWithKey(
  registration: ServiceWorkerRegistration,
  key: Uint8Array<ArrayBuffer>,
): Promise<PushSubscription> {
  const options: PushSubscriptionOptionsInit = { userVisibleOnly: true, applicationServerKey: key }
  try {
    return await registration.pushManager.subscribe(options)
  } catch (err) {
    // A subscription made with an earlier server key blocks a new one. Drop it
    // and try once more; any other failure is final.
    const stale = await registration.pushManager.getSubscription()
    if (!stale || keyMatches(stale.options?.applicationServerKey, key)) throw err
    await forgetSubscription(stale)
    return registration.pushManager.subscribe(options)
  }
}

/**
 * Switches push on for this device: the permission, then the browser's
 * subscription, then the server.
 *
 * Call it straight from the click handler, with the key and the registration
 * fetched beforehand. WebKit honours the permission prompt and subscribe() only
 * inside the user's gesture, and an awaited network call in front of them would
 * spend it. The permission request is therefore the first thing that runs.
 */
export async function enableWebPush(publicKey: string, registration?: ServiceWorkerRegistration | null): Promise<void> {
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission === 'denied') throw new WebPushError('denied')
  if (permission !== 'granted') throw new WebPushError('dismissed')

  let subscription: PushSubscription
  try {
    const active = registration?.pushManager ? registration : await waitForPushRegistration()
    if (!active?.pushManager) throw new WebPushError('failed', 'no service worker')
    subscription = await subscribeWithKey(active, base64UrlToUint8Array(publicKey))
  } catch (err) {
    throw err instanceof WebPushError ? err : new WebPushError('failed', err)
  }

  try {
    await pushApi.subscribe(toSubscriptionInput(subscription))
  } catch (err) {
    // The server never took this subscription, so it must not outlive the
    // failure: the card reads the browser's record, and would claim push works
    // on a device the server will never send to.
    await bestEffort('rolling back the browser subscription', () => subscription.unsubscribe())
    throw err instanceof WebPushError ? err : new WebPushError('failed', err)
  }
}

/**
 * Switches push off for this device. The server's row goes first, while this
 * session can still name the endpoint. If that request fails the browser still
 * unsubscribes: that alone stops delivery here, and the server drops a row the
 * push service answers 404 or 410 for on its next send.
 */
export async function disableWebPush(): Promise<void> {
  const subscription = await currentPushSubscription()
  if (!subscription) return
  await bestEffort('forgetting the device on the server', () => pushApi.unsubscribe(subscription.endpoint))
  await subscription.unsubscribe()
}

/**
 * Tells the server about this device's subscription again after sign-in. The
 * server upserts by endpoint, so repeating it is harmless, and it heals a row
 * that was lost or still belongs to the account that used this browser before.
 *
 * When the server's key changed since the device subscribed, every push to the
 * old subscription fails its signature check, so it is replaced. Permission is
 * already granted then, which lets the browser subscribe again without a
 * gesture; where it refuses, the device simply reads as off and the card offers
 * to switch it on. Never rejects.
 */
export async function resyncPushSubscription(): Promise<void> {
  if (!getWebPushSupport().supported || getPushPermission() !== 'granted' || isEffectivelyOffline()) return
  await bestEffort('re-registering this device', async () => {
    const registration = await existingRegistration()
    const subscription = await registration?.pushManager?.getSubscription()
    if (!registration || !subscription) return
    const { publicKey } = await pushApi.getPublicKey()
    const key = base64UrlToUint8Array(publicKey)
    let current = subscription
    if (!keyMatches(subscription.options?.applicationServerKey, key)) {
      await forgetSubscription(subscription)
      current = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
    }
    await pushApi.subscribe(toSubscriptionInput(current))
  })
}

/** Where the logout step tells the server to forget this device. */
const PUSH_SUBSCRIPTIONS_URL = '/api/notifications/push/subscriptions'

/**
 * The server half of the logout teardown, as a plain fetch rather than through
 * apiClient: when the session has already run out the answer is a 401, and
 * apiClient meets that with its redirect to the login page, in the middle of
 * the logout. It carries its own timeout, so the request itself is cut off
 * rather than left running behind a logout that has moved on.
 */
async function forgetOnServerAtLogout(endpoint: string, timeoutMs: number): Promise<void> {
  const body: PushUnsubscribeRequest = { endpoint }
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), timeoutMs)
  try {
    const response = await fetch(PUSH_SUBSCRIPTIONS_URL, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abort.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The logout step: forget this device on the server and in the browser, so the
 * next account on a shared device does not receive this one's notifications.
 * It has to run while the session cookie still exists, and it waits at most
 * `timeoutMs`. Never rejects, and never redirects: a server that already
 * dropped the session, never answers or cannot be reached only costs the
 * server half, the browser still unsubscribes.
 *
 * The two halves run side by side rather than one after the other. The server
 * half may use up the whole timeout, and the browser half is the one that
 * stops delivery here, so it must not queue behind it. The server needs
 * nothing the browser still has to hold: the endpoint is already in hand, and
 * a row left behind goes on the next send, when the push service answers 404
 * or 410.
 */
export async function forgetPushDeviceOnLogout(timeoutMs = LOGOUT_PUSH_TIMEOUT_MS): Promise<void> {
  if (!hasPushApis()) return
  const teardown = bestEffort('forgetting this device at logout', async () => {
    const subscription = await currentPushSubscription()
    if (!subscription) return
    await Promise.all([
      bestEffort('forgetting the device on the server', () => forgetOnServerAtLogout(subscription.endpoint, timeoutMs)),
      bestEffort('unsubscribing in the browser', () => subscription.unsubscribe()),
    ])
  })
  await withTimeout(teardown, timeoutMs, undefined)
}
