import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * reconcileAppVersion notes the worker that served the page when its module
 * loads, so every test installs its fake service-worker container first and
 * then loads a fresh copy of the module.
 */

class FakeWorker extends EventTarget {
  state: string
  constructor(state: string) {
    super()
    this.state = state
  }
  become(state: string) {
    this.state = state
    this.dispatchEvent(new Event('statechange'))
  }
}

class FakeRegistration {
  active: FakeWorker | null = null
  installing: FakeWorker | null = null
  waiting: FakeWorker | null = null
  update = vi.fn(async () => this)
}

class FakeContainer extends EventTarget {
  controller: FakeWorker | null
  getRegistration = vi.fn()
  constructor(controller: FakeWorker | null) {
    super()
    this.controller = controller
  }
  /** The browser activates a new worker and hands it this page. */
  takeOver() {
    this.controller = new FakeWorker('activated')
    this.dispatchEvent(new Event('controllerchange'))
  }
}

function installWorker(controller: FakeWorker | null = new FakeWorker('activated')) {
  const registration = new FakeRegistration()
  registration.active = controller
  const container = new FakeContainer(controller)
  container.getRegistration.mockResolvedValue(registration)
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container })
  return { container, registration }
}

/** update() finds a new sw.js and leaves the new worker installing. */
function updateInstalls(registration: FakeRegistration) {
  const incoming = new FakeWorker('installing')
  registration.update.mockImplementation(async () => {
    registration.installing = incoming
    return registration
  })
  return incoming
}

async function loadModule() {
  vi.resetModules()
  return import('./versionHandover')
}

/** Lets one kind of storage throw while the other keeps working. */
function breakStorage(method: 'getItem' | 'setItem', broken: () => Storage) {
  const original = Storage.prototype[method] as (...args: string[]) => unknown
  vi.spyOn(Storage.prototype, method).mockImplementation(function (this: Storage, ...args: string[]) {
    if (this === broken()) throw new DOMException('The operation is insecure.', 'SecurityError')
    return original.apply(this, args)
  } as never)
}

const marker = () => localStorage.getItem('trek_app_version')
// The version the bundle under test is built as (vite define, from package.json).
const BUILT = __TREK_UI_VERSION__
let reload: ReturnType<typeof vi.fn>
let plainReload: ReturnType<typeof vi.fn>

beforeEach(() => {
  // Every reload here asks for the page under a fresh URL (reloadFresh), which is
  // a location.replace. `plainReload` is the location.reload() it must not use.
  reload = vi.fn()
  plainReload = vi.fn()
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, href: 'http://localhost/dashboard', replace: reload, reload: plainReload },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (navigator as { serviceWorker?: unknown }).serviceWorker
})

describe('reconcileAppVersion: when nothing needs to happen', () => {
  it.each([
    ['nothing at all', undefined],
    ['a number', 431],
    ['an empty string', ''],
    ['markup', '<script>alert(1)</script>'],
    ['an overlong value', '4'.repeat(65)],
  ])('FE-UTIL-VERSION-001: ignores %s as the reported version', async (_label, reported) => {
    const { container } = installWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(reported)

    expect(marker()).toBe('4.3.0')
    expect(container.getRegistration).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-002: the first launch on a device only records the version', async () => {
    const { container } = installWorker()
    const { reconcileAppVersion } = await loadModule()

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.1')
    expect(container.getRegistration).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-003: the version this device already runs changes nothing', async () => {
    const { container } = installWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.1')

    await reconcileAppVersion('4.3.1')

    expect(container.getRegistration).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-004: unreadable storage leaves the worker alone', async () => {
    const { container } = installWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    breakStorage('getItem', () => localStorage)

    await expect(reconcileAppVersion('4.3.1')).resolves.toBeUndefined()

    expect(container.getRegistration).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-005: a browser that throws on the service worker itself still loads the app', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      get() { throw new DOMException('The operation is insecure.', 'SecurityError') },
    })
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    // Nothing could be asked, so the next launch asks again.
    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('reconcileAppVersion: a new version without a handover to wait for', () => {
  it('FE-UTIL-VERSION-010: without service worker support it records the version and reloads once', async () => {
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.1')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-011: without a registration it records the version and reloads once', async () => {
    const { container } = installWorker(null)
    container.getRegistration.mockResolvedValue(undefined)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.1')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-012: a worker the browser swapped in since the page loaded gets one reload and no update', async () => {
    const { container, registration } = installWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    // The browser's own check on navigation got there before the server answered.
    container.takeOver()

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.1')
    expect(reload).toHaveBeenCalledTimes(1)
    expect(registration.update).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-013: a worker claiming a page it did not serve is no takeover', async () => {
    const { container, registration } = installWorker(null)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    container.controller = new FakeWorker('activated')

    await reconcileAppVersion('4.3.1')

    expect(registration.update).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-014: an unchanged sw.js leaves nothing to hand over', async () => {
    const { container, registration } = installWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    expect(registration.update).toHaveBeenCalledTimes(1)
    expect(marker()).toBe('4.3.1')
    expect(reload).not.toHaveBeenCalled()

    // A takeover later in the session is not this launch's business.
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-015: a page from the network built as the new version records it without a reload (#2524)', async () => {
    const { container } = installWorker(null)
    container.getRegistration.mockResolvedValue(undefined)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)

    expect(marker()).toBe(BUILT)
    expect(reload).not.toHaveBeenCalled()
    expect(plainReload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-016: ...and the worker registered after it claims the page without a reload (#2524)', async () => {
    // Where the way out of a broken shell lands: the precache and the worker were
    // dropped, the page came from the server, and the new worker is installing.
    const { container, registration } = installWorker(null)
    updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)
    container.takeOver()

    expect(marker()).toBe(BUILT)
    expect(registration.update).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-019: ...and so does a page the worker registered after it has claimed already (#2524)', async () => {
    const { container, registration } = installWorker(null)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    // The fresh precache was quick, and its worker took the page before the server answered.
    container.takeOver()
    registration.active = container.controller

    await reconcileAppVersion(BUILT)

    expect(marker()).toBe(BUILT)
    expect(registration.update).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-017: a page a worker served goes through the handover whatever it was built as', async () => {
    const { container, registration } = installWorker()
    updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)
    expect(marker()).toBe('4.3.0')

    container.takeOver()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-018: the reload asks for the page under a fresh URL, past a proxy that keeps index.html (#2524)', async () => {
    const { container } = installWorker(null)
    container.getRegistration.mockResolvedValue(undefined)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    // A kept index.html runs an older bundle than the server reports.
    await reconcileAppVersion('4.3.1')

    expect(plainReload).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(1)
    const target = new URL(reload.mock.calls[0][0] as string)
    expect(target.pathname).toBe('/dashboard')
    expect(target.searchParams.get('trek-reload')).toBeTruthy()
  })

})

describe('reconcileAppVersion: handing over to the new build', () => {
  it('FE-UTIL-VERSION-020: reloads once the new worker has taken over, and only then records the version', async () => {
    const { container, registration } = installWorker()
    const incoming = updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')
    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()

    incoming.become('activated')
    container.takeOver()
    expect(marker()).toBe('4.3.1')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-021: a worker already installed and waiting counts as the incoming one', async () => {
    const { container, registration } = installWorker()
    registration.waiting = new FakeWorker('installed')
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')
    expect(marker()).toBe('4.3.0')

    container.takeOver()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-022: an update that fails is left for the next launch, without a reload', async () => {
    const { container, registration } = installWorker()
    registration.update.mockRejectedValue(new TypeError('Failed to update a ServiceWorker: network error'))
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-023: an install that goes redundant is left for the next launch', async () => {
    const { container, registration } = installWorker()
    const incoming = updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')
    incoming.become('redundant')

    expect(marker()).toBe('4.3.0')
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-024: a registration lookup that throws is left for the next launch', async () => {
    const { container } = installWorker()
    container.getRegistration.mockRejectedValue(new Error('no worker'))
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('reconcileAppVersion: a page loaded past an older worker', () => {
  // A hard reload, or a load with the worker bypassed, gets the new bundle from
  // the network while the previous build's worker stays registered and would
  // serve its own shell to the next tab or launch (#2524).
  function pastOlderWorker() {
    const installed = installWorker(null)
    installed.registration.active = new FakeWorker('activated')
    return installed
  }

  it('FE-UTIL-VERSION-025: asks for the new worker and records the version only once it has taken over', async () => {
    const { container, registration } = pastOlderWorker()
    const incoming = updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)

    expect(registration.update).toHaveBeenCalledTimes(1)
    expect(marker()).toBe('4.3.0')

    incoming.become('activated')
    container.takeOver()
    expect(marker()).toBe(BUILT)
    // The page runs that bundle already, so there is nothing to reload for.
    expect(reload).not.toHaveBeenCalled()
    expect(plainReload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-026: an install that goes redundant leaves the marker for the next launch', async () => {
    const { container, registration } = pastOlderWorker()
    const incoming = updateInstalls(registration)
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)
    incoming.become('redundant')
    container.takeOver()

    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-027: an unchanged sw.js means that worker is this build, so the version is recorded', async () => {
    const { container, registration } = pastOlderWorker()
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    // It claimed the page while the update was being checked.
    registration.update.mockImplementation(async () => {
      container.controller = registration.active
      return registration
    })

    await reconcileAppVersion(BUILT)

    expect(registration.update).toHaveBeenCalledTimes(1)
    expect(marker()).toBe(BUILT)
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-UTIL-VERSION-028: an update that fails leaves the marker for the next launch', async () => {
    const { registration } = pastOlderWorker()
    registration.update.mockRejectedValue(new TypeError('Failed to update a ServiceWorker: network error'))
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion(BUILT)

    expect(marker()).toBe('4.3.0')
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('reconcileAppVersion: the reload guard', () => {
  it('FE-UTIL-VERSION-030: a marker that cannot be written does not turn into a reload loop', async () => {
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    breakStorage('setItem', () => localStorage)

    // Every load of this session sees the new version again.
    await reconcileAppVersion('4.3.1')
    await reconcileAppVersion('4.3.1')
    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.0')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-VERSION-031: the next release in the same session still gets its reload', async () => {
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')

    await reconcileAppVersion('4.3.1')
    await reconcileAppVersion('4.3.1-1')

    expect(marker()).toBe('4.3.1-1')
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('FE-UTIL-VERSION-032: without session storage there is no guard, so there is no reload either', async () => {
    const { reconcileAppVersion } = await loadModule()
    localStorage.setItem('trek_app_version', '4.3.0')
    breakStorage('getItem', () => sessionStorage)

    await reconcileAppVersion('4.3.1')

    expect(marker()).toBe('4.3.1')
    expect(reload).not.toHaveBeenCalled()
  })
})
