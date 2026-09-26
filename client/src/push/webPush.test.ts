/**
 * FE-PUSH-001 to FE-PUSH-044: this device's Web Push, against a fake browser.
 *
 * jsdom has no service worker, no PushManager and no Notification, so every
 * case installs the three by hand. What is worth pinning here:
 *
 *  1. **Support is a reason, not a yes/no.** An insecure origin, an iPhone in
 *     a Safari tab and a browser without push each need a different sentence,
 *     because each has a different fix.
 *  2. **The gesture.** WebKit honours the permission prompt only inside the
 *     click, so `enableWebPush` must ask before its first await.
 *  3. **The browser is the record.** A subscription the server refused is
 *     rolled back, switching off unsubscribes even when the server cannot be
 *     told, and logout forgets the device before the cookie goes, bounded so it
 *     can never hang, and with a plain fetch so a 401 cannot redirect.
 *  4. **The re-sync after sign-in** repeats what the device holds, replaces a
 *     subscription made with an old server key, and never calls update().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({
  getPublicKey: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))
vi.mock('../api/push', () => ({ pushApi: api }))

const network = vi.hoisted(() => ({ offline: false }))
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }))

import {
  base64UrlToUint8Array,
  currentPushSubscription,
  disableWebPush,
  enableWebPush,
  forgetPushDeviceOnLogout,
  getPushPermission,
  getWebPushSupport,
  loadPushPublicKey,
  readWebPushDeviceState,
  resyncPushSubscription,
  toSubscriptionInput,
  waitForPushRegistration,
  WebPushError,
} from './webPush'

/** A P-256 point is 65 bytes; these tests only need two keys that differ. */
const SERVER_KEY = 'BAECAwQ'
const OTHER_KEY = 'BAUGBwg'

class FakeSubscription {
  readonly options: { applicationServerKey: ArrayBuffer | null; userVisibleOnly: boolean }
  unsubscribe = vi.fn(async () => true)

  constructor(
    readonly endpoint: string,
    key: Uint8Array | null,
  ) {
    this.options = { applicationServerKey: key ? new Uint8Array(key).buffer : null, userVisibleOnly: true }
  }

  toJSON() {
    return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'p256-' + this.endpoint, auth: 'auth' } }
  }
}

class FakePushManager {
  current: FakeSubscription | null = null
  created = 0
  subscribe = vi.fn(async (options: { userVisibleOnly?: boolean; applicationServerKey: Uint8Array }) => {
    this.created++
    this.current = new FakeSubscription(`https://push.example/sub-${this.created}`, options.applicationServerKey)
    return this.current
  })
  getSubscription = vi.fn(async () => this.current)
}

interface Browser {
  pushManager: FakePushManager
  registration: { pushManager: FakePushManager; update: ReturnType<typeof vi.fn> }
  container: { getRegistration: ReturnType<typeof vi.fn>; ready: Promise<unknown> }
  notification: { permission: NotificationPermission; requestPermission: ReturnType<typeof vi.fn> }
}

function installBrowser(opts: { permission?: NotificationPermission; answer?: NotificationPermission } = {}): Browser {
  const pushManager = new FakePushManager()
  const registration = { pushManager, update: vi.fn() }
  const container = { getRegistration: vi.fn(async () => registration), ready: Promise.resolve(registration) }
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container })
  const notification = {
    permission: opts.permission ?? 'default',
    requestPermission: vi.fn(async () => {
      notification.permission = opts.answer ?? 'granted'
      return notification.permission
    }),
  }
  vi.stubGlobal('Notification', notification)
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal('isSecureContext', true)
  return { pushManager, registration, container, notification }
}

function subscribed(browser: Browser, key = SERVER_KEY, endpoint = 'https://push.example/existing') {
  browser.pushManager.current = new FakeSubscription(endpoint, base64UrlToUint8Array(key))
  return browser.pushManager.current
}

/** Own properties shadow jsdom's prototype getters; afterEach deletes them again. */
function setUserAgent(ua: string, touchPoints = 0) {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => ua })
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => touchPoints })
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'

beforeEach(() => {
  vi.clearAllMocks()
  network.offline = false
  api.getPublicKey.mockResolvedValue({ publicKey: SERVER_KEY })
  api.subscribe.mockResolvedValue({ success: true, devices: 1 })
  api.unsubscribe.mockResolvedValue({ success: true })
  setUserAgent(CHROME)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
  delete (navigator as unknown as { standalone?: unknown }).standalone
  delete (navigator as unknown as { userAgent?: unknown }).userAgent
  delete (navigator as unknown as { maxTouchPoints?: unknown }).maxTouchPoints
})

describe('getWebPushSupport', () => {
  it('FE-PUSH-001: a secure browser with a worker, PushManager and Notification is supported', () => {
    installBrowser()
    expect(getWebPushSupport()).toEqual({ supported: true, reason: null })
  })

  it('FE-PUSH-002: an insecure origin says so before anything else', () => {
    installBrowser()
    vi.stubGlobal('isSecureContext', false)
    setUserAgent(IPHONE)
    expect(getWebPushSupport()).toEqual({ supported: false, reason: 'insecure' })
  })

  it('FE-PUSH-003: an iPhone in a Safari tab is told to add TREK to the Home Screen', () => {
    vi.stubGlobal('isSecureContext', true)
    setUserAgent(IPHONE, 5)
    expect(getWebPushSupport()).toEqual({ supported: false, reason: 'ios-install' })
  })

  it('FE-PUSH-004: an iPad asking for the desktop site counts as iOS too', () => {
    installBrowser()
    setUserAgent(IPAD_DESKTOP, 5)
    expect(getWebPushSupport().reason).toBe('ios-install')
  })

  it('FE-PUSH-005: a real Mac (no touch screen) is not mistaken for an iPad', () => {
    installBrowser()
    setUserAgent(IPAD_DESKTOP, 0)
    expect(getWebPushSupport().supported).toBe(true)
  })

  it('FE-PUSH-006: the installed iOS app is supported', () => {
    installBrowser()
    setUserAgent(IPHONE, 5)
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
    expect(getWebPushSupport().supported).toBe(true)
  })

  it('FE-PUSH-007: the installed app on an iOS without push still reads as unsupported', () => {
    vi.stubGlobal('isSecureContext', true)
    setUserAgent(IPHONE, 5)
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
    expect(getWebPushSupport()).toEqual({ supported: false, reason: 'unsupported' })
  })

  it('FE-PUSH-008: a desktop browser without the APIs is unsupported', () => {
    vi.stubGlobal('isSecureContext', true)
    expect(getWebPushSupport()).toEqual({ supported: false, reason: 'unsupported' })
  })
})

describe('small helpers', () => {
  it('FE-PUSH-009: the permission falls back to default where Notification is missing', () => {
    expect(getPushPermission()).toBe('default')
    installBrowser({ permission: 'denied' })
    expect(getPushPermission()).toBe('denied')
  })

  it('FE-PUSH-010: base64url keys decode to their raw bytes, padding or not', () => {
    expect(Array.from(base64UrlToUint8Array('AQID'))).toEqual([1, 2, 3])
    expect(Array.from(base64UrlToUint8Array('-_8'))).toEqual([251, 255])
    expect(Array.from(base64UrlToUint8Array('-_8='))).toEqual([251, 255])
  })

  it('FE-PUSH-011: a subscription becomes the shared contract shape', () => {
    const sub = new FakeSubscription('https://push.example/a', null)
    expect(toSubscriptionInput(sub as unknown as PushSubscription)).toEqual({
      endpoint: 'https://push.example/a',
      expirationTime: null,
      keys: { p256dh: 'p256-https://push.example/a', auth: 'auth' },
    })
  })

  it('FE-PUSH-012: a subscription without keys is refused rather than sent half', () => {
    const broken = { toJSON: () => ({ endpoint: 'https://push.example/a', keys: {} }) }
    expect(() => toSubscriptionInput(broken as unknown as PushSubscription)).toThrow(WebPushError)
  })

  it('FE-PUSH-013: the public key loads, and a failure is null rather than a rejection', async () => {
    await expect(loadPushPublicKey()).resolves.toBe(SERVER_KEY)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.getPublicKey.mockRejectedValueOnce(new Error('offline'))
    await expect(loadPushPublicKey()).resolves.toBeNull()
  })

  it('FE-PUSH-014: there is no subscription to read without the APIs or a registration', async () => {
    await expect(currentPushSubscription()).resolves.toBeNull()
    const browser = installBrowser()
    browser.container.getRegistration.mockResolvedValueOnce(undefined)
    await expect(currentPushSubscription()).resolves.toBeNull()
  })
})

describe('waitForPushRegistration', () => {
  it('FE-PUSH-015: hands over the active registration', async () => {
    const browser = installBrowser()
    await expect(waitForPushRegistration()).resolves.toBe(browser.registration)
  })

  it('FE-PUSH-016: gives up after the timeout on a page that never gets a worker', async () => {
    const browser = installBrowser()
    browser.container.ready = new Promise(() => {})
    vi.useFakeTimers()
    const waiting = waitForPushRegistration(1000)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(waiting).resolves.toBeNull()
  })

  it('FE-PUSH-017: is null straight away where the APIs are missing', async () => {
    await expect(waitForPushRegistration()).resolves.toBeNull()
  })
})

describe('readWebPushDeviceState', () => {
  it('FE-PUSH-018: an unsupported browser reports its reason', async () => {
    vi.stubGlobal('isSecureContext', false)
    await expect(readWebPushDeviceState()).resolves.toBe('insecure')
  })

  it('FE-PUSH-019: a blocked permission wins over an old subscription', async () => {
    const browser = installBrowser({ permission: 'denied' })
    subscribed(browser)
    await expect(readWebPushDeviceState()).resolves.toBe('denied')
  })

  it('FE-PUSH-020: on with a subscription, off without', async () => {
    const browser = installBrowser({ permission: 'granted' })
    await expect(readWebPushDeviceState()).resolves.toBe('off')
    subscribed(browser)
    await expect(readWebPushDeviceState()).resolves.toBe('on')
  })

  it('FE-PUSH-021: a registration that cannot be read counts as off, not as an error', async () => {
    const browser = installBrowser({ permission: 'granted' })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    browser.container.getRegistration.mockRejectedValueOnce(new Error('site data blocked'))
    await expect(readWebPushDeviceState()).resolves.toBe('off')
  })
})

describe('enableWebPush', () => {
  it('FE-PUSH-022: asks for permission before its first await, so the gesture still counts', async () => {
    const browser = installBrowser()
    const done = enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)
    expect(browser.notification.requestPermission).toHaveBeenCalledTimes(1)
    await done
  })

  it('FE-PUSH-023: subscribes visibly with the server key and registers the device', async () => {
    const browser = installBrowser({ permission: 'granted' })
    await enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)

    expect(browser.notification.requestPermission).not.toHaveBeenCalled()
    const options = browser.pushManager.subscribe.mock.calls[0][0]
    expect(options.userVisibleOnly).toBe(true)
    expect(Array.from(options.applicationServerKey)).toEqual(Array.from(base64UrlToUint8Array(SERVER_KEY)))
    expect(api.subscribe).toHaveBeenCalledWith(toSubscriptionInput(browser.pushManager.current as unknown as PushSubscription))
  })

  it('FE-PUSH-024: waits for the worker when no registration was handed over', async () => {
    const browser = installBrowser({ permission: 'granted' })
    await enableWebPush(SERVER_KEY)
    expect(browser.pushManager.subscribe).toHaveBeenCalledTimes(1)
  })

  it('FE-PUSH-025: a block is reported as denied and nothing is subscribed', async () => {
    const browser = installBrowser({ answer: 'denied' })
    await expect(enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)).rejects.toMatchObject({ code: 'denied' })
    expect(browser.pushManager.subscribe).not.toHaveBeenCalled()
  })

  it('FE-PUSH-026: a prompt closed without an answer is dismissed, not a failure', async () => {
    const browser = installBrowser({ answer: 'default' })
    await expect(enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)).rejects.toMatchObject({ code: 'dismissed' })
  })

  it('FE-PUSH-027: without a worker it fails instead of spinning', async () => {
    const browser = installBrowser({ permission: 'granted' })
    browser.container.ready = new Promise(() => {})
    vi.useFakeTimers()
    const done = enableWebPush(SERVER_KEY).catch(err => err)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await done).toMatchObject({ code: 'failed' })
  })

  it('FE-PUSH-028: a subscription left over from an older server key is replaced', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const stale = subscribed(browser, OTHER_KEY, 'https://push.example/stale')
    browser.pushManager.subscribe.mockRejectedValueOnce(new DOMException('key mismatch', 'InvalidStateError'))

    await enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)

    expect(api.unsubscribe).toHaveBeenCalledWith('https://push.example/stale')
    expect(stale.unsubscribe).toHaveBeenCalled()
    expect(browser.pushManager.subscribe).toHaveBeenCalledTimes(2)
    expect(api.subscribe).toHaveBeenCalledTimes(1)
  })

  it('FE-PUSH-029: any other subscribe failure is final', async () => {
    const browser = installBrowser({ permission: 'granted' })
    browser.pushManager.subscribe.mockRejectedValueOnce(new DOMException('push service down', 'AbortError'))
    await expect(enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)).rejects.toMatchObject({ code: 'failed' })
    expect(browser.pushManager.subscribe).toHaveBeenCalledTimes(1)
    expect(api.subscribe).not.toHaveBeenCalled()
  })

  it('FE-PUSH-030: a subscription the server refused is rolled back in the browser', async () => {
    const browser = installBrowser({ permission: 'granted' })
    api.subscribe.mockRejectedValueOnce(new Error('400'))
    await expect(enableWebPush(SERVER_KEY, browser.registration as unknown as ServiceWorkerRegistration)).rejects.toMatchObject({ code: 'failed' })
    expect(browser.pushManager.current?.unsubscribe).toHaveBeenCalled()
  })
})

describe('disableWebPush', () => {
  it('FE-PUSH-031: forgets the device on the server, then unsubscribes the browser', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    const order: string[] = []
    api.unsubscribe.mockImplementationOnce(async () => {
      order.push('server')
      return { success: true }
    })
    sub.unsubscribe.mockImplementationOnce(async () => {
      order.push('browser')
      return true
    })

    await disableWebPush()

    expect(api.unsubscribe).toHaveBeenCalledWith('https://push.example/existing')
    expect(order).toEqual(['server', 'browser'])
  })

  it('FE-PUSH-032: still unsubscribes when the server cannot be told', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.unsubscribe.mockRejectedValueOnce(new Error('offline'))
    await disableWebPush()
    expect(sub.unsubscribe).toHaveBeenCalled()
  })

  it('FE-PUSH-033: does nothing without a subscription, and reports a browser that refuses', async () => {
    const browser = installBrowser({ permission: 'granted' })
    await disableWebPush()
    expect(api.unsubscribe).not.toHaveBeenCalled()

    const sub = subscribed(browser)
    sub.unsubscribe.mockRejectedValueOnce(new Error('refused'))
    await expect(disableWebPush()).rejects.toThrow('refused')
  })
})

describe('resyncPushSubscription', () => {
  it('FE-PUSH-034: stays quiet when push is unsupported, not granted or the app is offline', async () => {
    await resyncPushSubscription()
    const browser = installBrowser({ permission: 'default' })
    subscribed(browser)
    await resyncPushSubscription()
    browser.notification.permission = 'granted'
    network.offline = true
    await resyncPushSubscription()
    expect(browser.container.getRegistration).not.toHaveBeenCalled()
    expect(api.subscribe).not.toHaveBeenCalled()
  })

  it('FE-PUSH-035: registers the subscription the device holds again, without update()', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    await resyncPushSubscription()
    expect(api.subscribe).toHaveBeenCalledWith(toSubscriptionInput(sub as unknown as PushSubscription))
    expect(browser.pushManager.subscribe).not.toHaveBeenCalled()
    expect(browser.registration.update).not.toHaveBeenCalled()
  })

  it('FE-PUSH-036: does nothing for a device that never switched push on', async () => {
    installBrowser({ permission: 'granted' })
    await resyncPushSubscription()
    expect(api.getPublicKey).not.toHaveBeenCalled()
    expect(api.subscribe).not.toHaveBeenCalled()
  })

  it('FE-PUSH-037: replaces a subscription made with an old server key', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const stale = subscribed(browser, OTHER_KEY, 'https://push.example/stale')
    await resyncPushSubscription()
    expect(api.unsubscribe).toHaveBeenCalledWith('https://push.example/stale')
    expect(stale.unsubscribe).toHaveBeenCalled()
    expect(browser.pushManager.subscribe).toHaveBeenCalledTimes(1)
    expect(api.subscribe).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'https://push.example/sub-1' }))
  })

  it('FE-PUSH-038: a browser that does not report its key is taken at its word', async () => {
    const browser = installBrowser({ permission: 'granted' })
    browser.pushManager.current = new FakeSubscription('https://push.example/unknown-key', null)
    await resyncPushSubscription()
    expect(browser.pushManager.subscribe).not.toHaveBeenCalled()
    expect(api.subscribe).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'https://push.example/unknown-key' }))
  })

  it('FE-PUSH-039: never rejects, even when the server does', async () => {
    const browser = installBrowser({ permission: 'granted' })
    subscribed(browser)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.subscribe.mockRejectedValueOnce(new Error('500'))
    await expect(resyncPushSubscription()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })
})

describe('forgetPushDeviceOnLogout', () => {
  /** The logout DELETE is a plain fetch, so a 401 can never reach apiClient's login redirect. */
  function stubFetch(answer: (init?: RequestInit) => Promise<Response>) {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => answer(init))
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('FE-PUSH-040: forgets the device on the server with a plain fetch, and in the browser', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    const fetchMock = stubFetch(async () => Response.json({ success: true }))

    await forgetPushDeviceOnLogout()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/notifications/push/subscriptions')
    expect(init).toMatchObject({
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(JSON.parse(String(init?.body))).toEqual({ endpoint: 'https://push.example/existing' })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(api.unsubscribe).not.toHaveBeenCalled()
    expect(sub.unsubscribe).toHaveBeenCalled()
  })

  it('FE-PUSH-041: returns at once where there is no push at all', async () => {
    const fetchMock = stubFetch(async () => Response.json({ success: true }))
    await forgetPushDeviceOnLogout()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(api.unsubscribe).not.toHaveBeenCalled()
  })

  it('FE-PUSH-042: a server that never answers cannot hold the logout up or keep the browser subscribed', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Like a real fetch to a server that never answers: it settles only once its signal aborts.
    const fetchMock = stubFetch(
      init =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    vi.useFakeTimers()
    let finished = false
    const done = forgetPushDeviceOnLogout(3000).then(() => {
      finished = true
    })
    await vi.advanceTimersByTimeAsync(2999)
    expect(finished).toBe(false)
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false)
    // The browser half never waited for the server half.
    expect(sub.unsubscribe).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await done
    expect(finished).toBe(true)
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(warn).toHaveBeenCalledWith('[push] forgetting the device on the server failed', expect.any(DOMException))
  })

  it('FE-PUSH-043: a 401 from a session that already ran out neither redirects nor stops the browser half', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const before = window.location.href
    stubFetch(async () => Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 }))

    await expect(forgetPushDeviceOnLogout()).resolves.toBeUndefined()

    expect(window.location.href).toBe(before)
    expect(api.unsubscribe).not.toHaveBeenCalled()
    expect(sub.unsubscribe).toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('[push] forgetting the device on the server failed', expect.any(Error))
  })

  it('FE-PUSH-044: a network failure on the server half still unsubscribes the browser', async () => {
    const browser = installBrowser({ permission: 'granted' })
    const sub = subscribed(browser)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await forgetPushDeviceOnLogout()
    expect(sub.unsubscribe).toHaveBeenCalled()
  })
})
