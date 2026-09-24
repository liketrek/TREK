import React from 'react'
import { render, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../tests/helpers/msw/server'
import { useAuthStore } from './store/authStore'
import { resetAllStores } from '../tests/helpers/store'
import App from './App'

/*
 * #2458: an installed PWA kept serving the previous UI after a server upgrade.
 *
 * The launch probe compares the server's version with a marker in localStorage
 * and, on a mismatch, asks the service worker to fetch the new build and reloads
 * once it has taken over. These tests drive that probe across consecutive
 * launches against a fake service-worker container, so a handover that never
 * completed can be told apart from one that did.
 *
 * The fake is installed before App is imported (vi.hoisted), so code that
 * notes the controlling worker when its module loads sees the worker that
 * served this page, exactly as in the browser.
 */
const sw = vi.hoisted(() => {
  class FakeWorker extends EventTarget {
    state: string
    readonly scriptURL = '/sw.js'
    constructor(state: string) {
      super()
      this.state = state
    }
    become(state: string) {
      this.state = state
      this.dispatchEvent(new Event('statechange'))
    }
  }
  class FakeRegistration extends EventTarget {
    active: FakeWorker | null = null
    installing: FakeWorker | null = null
    waiting: FakeWorker | null = null
    readonly scope = '/'
    update = vi.fn()
  }
  class FakeContainer extends EventTarget {
    controller: FakeWorker | null = null
    getRegistration = vi.fn()
    // Listeners a page adds die with that page. Those added while modules load
    // (before `trackPage` is switched on) stand for module-level code and stay.
    trackPage = false
    private pageListeners: Array<[string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]> = []
    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
      super.addEventListener(type, listener, options)
      if (this.trackPage && listener) this.pageListeners.push([type, listener, options])
    }
    dropPageListeners() {
      for (const [type, listener, options] of this.pageListeners) super.removeEventListener(type, listener, options)
      this.pageListeners = []
    }
  }
  const oldWorker = new FakeWorker('activated')
  const registration = new FakeRegistration()
  const container = new FakeContainer()
  registration.active = oldWorker
  container.controller = oldWorker
  container.getRegistration.mockImplementation(async () => registration)
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container })
  return { FakeWorker, registration, container, oldWorker }
})

vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login</div> }))
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>Dashboard</div> }))
vi.mock('./hooks/useInAppNotificationListener.ts', () => ({ useInAppNotificationListener: vi.fn() }))

// Every import above has been evaluated by now; from here on a listener belongs to a page.
sw.container.trackPage = true

const reload = vi.fn()
let configHits = 0

function serveVersion(version: string, gate?: Promise<void>) {
  server.use(
    http.get('/api/auth/app-config', async () => {
      configHits++
      if (gate) await gate
      return HttpResponse.json({ version })
    }),
  )
}

/** The browser's handover: the new worker installs, activates and claims the page. */
function handOver() {
  const next = new sw.FakeWorker('activated')
  sw.registration.installing = null
  sw.registration.active = next
  sw.container.controller = next
  sw.container.dispatchEvent(new Event('controllerchange'))
}

/** update() finds a new sw.js and starts installing it; `then` decides how the install ends. */
function updateStartsInstall(then: 'activates' | 'fails') {
  sw.registration.update.mockImplementation(async () => {
    const next = new sw.FakeWorker('installing')
    sw.registration.installing = next
    setTimeout(() => {
      if (then === 'activates') {
        next.become('activated')
        handOver()
      } else {
        // Workbox precaching is all-or-nothing: one failed fetch out of ~463
        // rejects the install event and the new worker is thrown away.
        sw.registration.installing = null
        next.become('redundant')
      }
    }, 0)
    return sw.registration
  })
}

/** One cold start of the installed app: fresh page, fresh session, same localStorage. */
async function launch() {
  sessionStorage.clear()
  const hitsBefore = configHits
  const view = render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  await waitFor(() => expect(configHits).toBe(hitsBefore + 1))
  // Let the probe, update() and the fake install run to completion.
  await act(async () => { await new Promise(r => setTimeout(r, 50)) })
  view.unmount()
  sw.container.dropPageListeners()
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  configHits = 0
  sw.registration.active = sw.oldWorker
  sw.registration.installing = null
  sw.registration.waiting = null
  sw.registration.update.mockReset()
  sw.registration.update.mockResolvedValue(sw.registration)
  sw.container.controller = sw.oldWorker
  sw.container.dropPageListeners()
  sw.container.getRegistration.mockReset()
  sw.container.getRegistration.mockImplementation(async () => sw.registration)
  reload.mockReset()
  Object.defineProperty(window, 'location', { writable: true, value: { ...window.location, reload } })
  server.use(
    http.get('/api/health/features', () => HttpResponse.json({ bookingImport: false, aiParsing: false })),
    http.get('/api/system-notices/active', () => HttpResponse.json([])),
  )
  useAuthStore.setState({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    appRequireMfa: false,
    loadUser: vi.fn().mockResolvedValue(undefined),
  })
})

describe('#2458 version handover: behaviour that must survive the fix', () => {
  it('FE-COMP-APP-2458-P1: a confirmed handover reloads once and is not repeated on the next launch', async () => {
    localStorage.setItem('trek_app_version', '4.3.0')
    serveVersion('4.3.1')
    updateStartsInstall('activates')

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('trek_app_version')).toBe('4.3.1')

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-APP-2458-P2: nothing to hand over (sw.js unchanged, same worker in control) neither reloads nor retries', async () => {
    // A release that changed nothing the precache holds leaves sw.js byte-identical,
    // so update() installs nothing. The bundle this page runs is already current.
    localStorage.setItem('trek_app_version', '4.3.0')
    serveVersion('4.3.1')

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it.each([
    ['a self-built image without the build arg', 'dev'],
    ['a test instance pinned to an older tag', '4.0.0'],
    ['a prerelease image, whose bundle keeps the last stable version', '4.4.0-pre.3'],
  ])('FE-COMP-APP-2458-P3: %s (server says %s, bundle is built as another version) never loops', async (_label, serverVersion) => {
    // The server reports APP_VERSION, the bundle carries client/package.json. On
    // these setups the two never agree, so a check against the bundle's own
    // version would see an update on every launch.
    serveVersion(serverVersion)

    await launch()
    await launch()
    await launch()
    expect(reload).not.toHaveBeenCalled()
    expect(sw.registration.update).not.toHaveBeenCalled()
  })
})

describe('#2458 version handover: the reported defect', () => {
  it('FE-COMP-APP-2458-01: an update() that rejects is retried on the next launch', async () => {
    localStorage.setItem('trek_app_version', '4.3.0')
    serveVersion('4.3.1')
    sw.registration.update.mockRejectedValue(new TypeError('Failed to update a ServiceWorker: network error'))

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)

    // Next cold start, network fine this time.
    updateStartsInstall('activates')
    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalled()
  })

  it('FE-COMP-APP-2458-02: a failed update() does not reload into the shell the same worker serves again', async () => {
    // The old worker still controls the page, so a plain reload is answered from
    // its precache: the same old UI, now with the marker saying it is current.
    localStorage.setItem('trek_app_version', '4.3.0')
    serveVersion('4.3.1')
    sw.registration.update.mockRejectedValue(new TypeError('Failed to update a ServiceWorker: network error'))

    await launch()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-COMP-APP-2458-03: an install that goes redundant is retried on the next launch', async () => {
    localStorage.setItem('trek_app_version', '4.3.0')
    serveVersion('4.3.1')
    updateStartsInstall('fails')

    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()

    updateStartsInstall('activates')
    await launch()
    expect(sw.registration.update).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  // Kept last: it swaps the controlling worker mid-launch, which code that
  // remembers "the controller changed since this page loaded" keeps seeing.
  it('FE-COMP-APP-2458-04: a worker that took over before the probe answered still reloads the page', async () => {
    // The browser checks sw.js on every navigation by itself. When that check
    // installs and activates the new worker before /api/auth/app-config has
    // answered, the takeover happens while nobody listens, and update() then
    // finds nothing newer. The page keeps running the bundle the old worker served.
    localStorage.setItem('trek_app_version', '4.3.0')
    let open!: () => void
    const gate = new Promise<void>(r => { open = r })
    serveVersion('4.3.1', gate)

    sessionStorage.clear()
    const view = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => expect(configHits).toBe(1))
    act(() => handOver())
    open()
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    view.unmount()
    sw.container.dropPageListeners()

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
