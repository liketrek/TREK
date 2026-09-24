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
let reload: ReturnType<typeof vi.fn>

beforeEach(() => {
  reload = vi.fn()
  Object.defineProperty(window, 'location', { writable: true, value: { ...window.location, reload } })
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
    await reconcileAppVersion('4.3.2')

    expect(marker()).toBe('4.3.2')
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
